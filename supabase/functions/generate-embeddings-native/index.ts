/// <reference types="https://esm.sh/v135/@supabase/functions-js@2.4.1/src/edge-runtime.d.ts" />

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

// Initialize the AI model session
const model = new Supabase.ai.Session('gte-small');

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
    console.log('=== NATIVE SUPABASE AI EMBEDDING START ===');
    
    const body = await req.json();
    const inputText = body.inputText;

    if (!inputText) {
      return new Response(JSON.stringify({ error: 'Missing inputText parameter' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const textsToEmbed = Array.isArray(inputText) ? inputText : [inputText];
    console.log(`Processing ${textsToEmbed.length} text(s) using native Supabase AI...`);

    // Generate embeddings using Supabase.ai.Session
    const embeddings: number[][] = [];
    
    for (const text of textsToEmbed) {
      console.log(`Generating embedding for: "${text.substring(0, 50)}..."`);
      
      // Use the correct Supabase AI API
      const output = await model.run(text, { 
        mean_pool: true, 
        normalize: true 
      });
      
      console.log(`Embedding generated, length: ${output.length}`);
      embeddings.push(output);
    }

    console.log(`Successfully generated ${embeddings.length} embeddings`);
    console.log('=== NATIVE SUPABASE AI EMBEDDING SUCCESS ===');

    return new Response(JSON.stringify({ 
      embeddings,
      debug: {
        inputCount: textsToEmbed.length,
        outputCount: embeddings.length,
        embeddingDimensions: embeddings[0]?.length || 0,
        method: 'native-supabase-ai-session'
      }
    }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      status: 200
    });

  } catch (error: any) {
    console.error('=== NATIVE SUPABASE AI EMBEDDING ERROR ===');
    console.error('Error details:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return new Response(JSON.stringify({ 
      error: `Native AI Session Error: ${error.message}`,
      errorType: error.name,
      debug: {
        method: 'native-supabase-ai-session',
        timestamp: new Date().toISOString()
      }
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
});

console.log('Native Supabase AI Session embedding function started...'); 