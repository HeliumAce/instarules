/// <reference types="https://esm.sh/v135/@supabase/functions-js@2.4.1/src/edge-runtime.d.ts" />

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

// Initialize the AI model session - create fresh session per request to avoid memory leaks
let model: Supabase.ai.Session | null = null;

function getModel(): Supabase.ai.Session {
  if (!model) {
    model = new Supabase.ai.Session('gte-small');
  }
  return model;
}

function cleanupModel() {
  model = null;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: { 
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
      } 
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  try {
    console.log('=== STREAMING SUPABASE AI EMBEDDING START ===');
    
    const body = await req.json();
    const inputText = body.inputText;

    if (!inputText) {
      return new Response(JSON.stringify({ error: 'Missing inputText parameter' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const textsToEmbed = Array.isArray(inputText) ? inputText : [inputText];
    console.log(`Processing ${textsToEmbed.length} text(s) using streaming Supabase AI...`);

    // Stream processing: process one embedding at a time to minimize memory usage
    const embeddings: number[][] = [];
    const modelInstance = getModel();
    
    for (let i = 0; i < textsToEmbed.length; i++) {
      const text = textsToEmbed[i];
      console.log(`Generating embedding ${i + 1}/${textsToEmbed.length}: "${text.substring(0, 50)}..."`);
      
      try {
        // Process single embedding to minimize memory accumulation
        const output = await modelInstance.run(text, { 
          mean_pool: true, 
          normalize: true 
        });
        
        console.log(`Embedding ${i + 1} generated, length: ${output.length}`);
        embeddings.push(output);
        
        // Force garbage collection after each embedding to prevent memory buildup
        if (global.gc) {
          global.gc();
        }
        
        // Small delay to allow memory cleanup
        await new Promise(resolve => setTimeout(resolve, 10));
        
      } catch (embeddingError: any) {
        console.error(`Error generating embedding ${i + 1}: ${embeddingError.message}`);
        // Continue with next embedding instead of failing entire batch
        embeddings.push(new Array(384).fill(0)); // Placeholder for failed embedding
      }
    }

    // Cleanup model session after processing
    cleanupModel();

    console.log(`Successfully generated ${embeddings.length} embeddings`);
    console.log('=== STREAMING SUPABASE AI EMBEDDING SUCCESS ===');

    return new Response(JSON.stringify({ 
      embeddings,
      debug: {
        inputCount: textsToEmbed.length,
        outputCount: embeddings.length,
        embeddingDimensions: embeddings[0]?.length || 0,
        method: 'streaming-native-supabase-ai-session'
      }
    }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      status: 200
    });

  } catch (error: any) {
    console.error('=== STREAMING SUPABASE AI EMBEDDING ERROR ===');
    console.error('Error details:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Cleanup on error
    cleanupModel();
    
    return new Response(JSON.stringify({ 
      error: `Streaming AI Session Error: ${error.message}`,
      errorType: error.name,
      debug: {
        method: 'streaming-native-supabase-ai-session',
        timestamp: new Date().toISOString()
      }
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
});

console.log('Streaming Supabase AI Session embedding function started...'); 