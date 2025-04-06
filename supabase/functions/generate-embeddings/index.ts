/// <reference types="https://esm.sh/v135/@supabase/functions-js@2.4.1/src/edge-runtime.d.ts" />

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'; // Use a specific stable version
import { pipeline, env, Pipeline } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.1';

// --- Environment Setup for Transformers.js ---
// Prevent loading local models - ensures deployment works
env.allowLocalModels = false;
// Disable browser caching in server environment
env.useBrowserCache = false;
// Specify a writable cache directory for Deno Deploy/Edge Functions
env.cacheDir = '/tmp/hf-cache'; // Deno Deploy often provides /tmp as writable

// --- Model Initialization (Singleton Pattern) ---
const MODEL_NAME = 'Supabase/gte-small';
let extractor: Pipeline | null = null; // Store the initialized pipeline
let modelLoadingPromise: Promise<Pipeline> | null = null;

async function getExtractor(): Promise<Pipeline> {
  if (extractor) {
    return extractor;
  }
  if (!modelLoadingPromise) {
    console.log(`Initializing embedding model: ${MODEL_NAME}`);
    modelLoadingPromise = new Promise(async (resolve, reject) => {
      try {
        // Initialize the feature-extraction pipeline
        const loadedExtractor = await pipeline('feature-extraction', MODEL_NAME, {
          quantized: false, // Server-side, prefer non-quantized for accuracy unless memory is tight
          // progress_callback: (progress: any) => console.log('Model loading progress:', progress),
        });
        console.log('Embedding model loaded successfully.');
        extractor = loadedExtractor;
        resolve(loadedExtractor);
      } catch (error) {
        console.error(`Failed to load embedding model '${MODEL_NAME}':`, error);
        modelLoadingPromise = null; // Reset promise on failure
        reject(error);
      }
    });
  }
  return modelLoadingPromise;
}

// Pre-warm the model on function startup (optional, but can reduce cold start latency)
getExtractor().catch(err => console.error("Initial model load failed:", err));

// --- Edge Function Handler ---
serve(async (req) => {
  // 1. Handle CORS Preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 
      'Access-Control-Allow-Origin': '*', // Adjust for specific origins if needed
      'Access-Control-Allow-Methods': 'POST', 
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
    } });
  }

  // 2. Validate Request Method and Content Type
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
  if (!req.headers.get('content-type')?.includes('application/json')) {
    return new Response(JSON.stringify({ error: 'Invalid Content-Type, must be application/json' }), {
      status: 415,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  try {
    // 3. Parse Input Body
    const body = await req.json();
    const inputText = body.inputText;

    if (!inputText || (Array.isArray(inputText) && inputText.length === 0)) {
      return new Response(JSON.stringify({ error: 'Missing required parameter "inputText" (string or array of strings)' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const textsToEmbed = Array.isArray(inputText) ? inputText : [inputText];
    console.log(`Received request to embed ${textsToEmbed.length} text(s).`);

    // 4. Get Embedding Model (wait if still loading)
    const model = await getExtractor();
    if (!model) {
         // This case should ideally not happen if getExtractor awaits correctly, but added for safety
         return new Response(JSON.stringify({ error: 'Embedding model is not available. Please try again later.' }), {
             status: 503, // Service Unavailable
             headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
         });
    }

    // 5. Generate Embeddings
    console.log('Generating embeddings...');
    const output = await model(textsToEmbed, {
      pooling: 'mean',    // Average pooling strategy
      normalize: true,    // Normalize embeddings to unit length (important for cosine similarity)
    });
    console.log('Embeddings generated successfully.');

    // 6. Extract and Format Embeddings
    const embeddings = output.tolist();

    if (!Array.isArray(embeddings)) {
        console.error("FATAL: output.tolist() did not return an array:", embeddings);
        throw new Error("Embedding output is not an array.");
    }

    // Ensure the output structure is as expected (array of arrays for batches, or single array for single input)
    // Check if the first element exists and if IT is an array (for batch case)
    const isLikelyBatchOutput = textsToEmbed.length > 1 && embeddings.length > 0 && Array.isArray(embeddings[0]);
    // Check if it's a single embedding output (single array of numbers)
    const isLikelySingleOutput = textsToEmbed.length === 1 && embeddings.length > 0 && typeof embeddings[0] === 'number';

    let finalEmbeddings: number[][];

    if (isLikelyBatchOutput) {
        finalEmbeddings = embeddings as number[][]; // Already in correct batch format
    } else if (isLikelySingleOutput) {
        finalEmbeddings = [embeddings as number[]]; // Wrap single embedding in an outer array
    } else if (textsToEmbed.length === 1 && embeddings.length === 0) {
        // Handle case where model returns empty array for single input (shouldn't happen ideally)
        console.warn("Warning: Model returned empty embedding for single input text.");
        finalEmbeddings = [[]]; // Return array containing an empty embedding
    } else if (textsToEmbed.length > 1 && embeddings.length === 0) {
         console.warn("Warning: Model returned empty embedding array for batch input.");
         finalEmbeddings = [];
    } else {
        // Fallback/Error case: Log the unexpected structure
        console.error("Unexpected embedding output structure.", {
            textsToEmbedLength: textsToEmbed.length,
            embeddingsOutput: embeddings,
        });
        throw new Error("Failed to format embeddings due to unexpected structure.");
    }

    // Log right before returning
    console.log(`Successfully processed. Returning ${finalEmbeddings.length} embedding(s).`);

    // 7. Return Successful Response
    const responseBody = JSON.stringify({ embeddings: finalEmbeddings });
    return new Response(responseBody, {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      status: 200,
    });

  } catch (error) {
    // Improved logging in the catch block
    console.error('Caught error in main handler:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    const errorStack = error instanceof Error ? error.stack : 'No stack trace available';
    console.error('Error Stack:', errorStack);

    const isClientError = error instanceof SyntaxError;
    const statusCode = isClientError ? 400 : 500;

    // Ensure the error message itself can be stringified
    let safeErrorMessage = 'Internal Server Error';
    try {
        // Use JSON.stringify on the error itself for more detail if possible
        safeErrorMessage = JSON.stringify(error, Object.getOwnPropertyNames(error));
    } catch (stringifyError) {
         // Fallback if the error object can't be fully stringified
         try {
             safeErrorMessage = JSON.stringify(errorMessage);
         } catch (innerStringifyError) {
             console.error("Could not stringify the original error message or error object.");
         }
    }

    return new Response(JSON.stringify({ error: `Processing failed: ${safeErrorMessage}` }), {
      status: statusCode,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
});

console.log(`Supabase Function 'generate-embeddings' started.\nModel: ${MODEL_NAME}\nWaiting for requests...`); 