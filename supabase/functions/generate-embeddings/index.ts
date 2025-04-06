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
    // '.tolist()' converts the tensor output to a standard nested JS array
    const embeddings = output.tolist();

    // Ensure the output structure is as expected (array of arrays for batches)
    if (!Array.isArray(embeddings) || (textsToEmbed.length > 1 && !Array.isArray(embeddings[0]))) {
      console.error("Unexpected embedding output format:", embeddings);
      throw new Error("Failed to format embeddings correctly.");
    }

    // If only one input text, the output might be a single array, wrap it
    const finalEmbeddings = textsToEmbed.length === 1 && !Array.isArray(embeddings[0]) ? [embeddings] : embeddings;

    // 7. Return Successful Response
    return new Response(JSON.stringify({ embeddings: finalEmbeddings }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      status: 200,
    });

  } catch (error) {
    console.error('Error processing embedding request:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    const isClientError = error instanceof SyntaxError;
    const statusCode = isClientError ? 400 : 500;
    return new Response(JSON.stringify({ error: `Internal Server Error: ${errorMessage}` }), {
      status: statusCode,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
});

console.log(`Supabase Function 'generate-embeddings' started.\nModel: ${MODEL_NAME}\nWaiting for requests...`); 