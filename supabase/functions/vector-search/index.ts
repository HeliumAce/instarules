// supabase/functions/vector-search/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from 'https://esm.sh/openai@4.10.0' // Use esm.sh for Deno compatibility

// Define required types (consider sharing these with frontend/backend if possible)
interface ArcsRuleSearchResult {
  id: string;
  content: string;
  metadata: Record<string, any>;
  similarity: number;
}

// Add CORS headers helper
const corsHeaders = {
  'Access-Control-Allow-Origin': '*' // Allow any origin for now, restrict in production
  ,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS', // Allow POST and OPTIONS for preflight
}

console.log("Vector search function initializing...");

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 0. Initialize clients (best practice: move outside handler if possible, but env vars needed)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Use Service Role Key for admin actions
       { auth: { persistSession: false } }
    );

    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    });
    const OPENAI_MODEL = 'text-embedding-3-small';

    // 1. Extract query from request body
    const { query } = await req.json();
    if (!query || typeof query !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing or invalid "query" in request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    console.log(`Received query: "${query}"`);

    // 2. Generate embedding for the query
    let queryEmbedding: number[];
    try {
      const embeddingResponse = await openai.embeddings.create({
        model: OPENAI_MODEL,
        input: query,
        encoding_format: "float",
      });
      queryEmbedding = embeddingResponse.data[0].embedding;
       console.log(`Generated embedding with dimension: ${queryEmbedding.length}`);
      if (queryEmbedding.length !== 1536) { // Dimension for text-embedding-3-small
           throw new Error(`Embedding dimension mismatch. Expected 1536, got ${queryEmbedding.length}`);
       }
    } catch (error) {
      console.error('Failed to generate query embedding:', error);
      throw new Error(`Failed to generate embedding: ${error.message}`);
    }

    // 3. Call the Supabase RPC function with dynamic threshold
    let matchThreshold = 0.50; // Initial threshold
    let matchCount = 8;      // Increased from 5

    try {
      console.log(`Calling RPC function 'match_arcs_rules' with threshold ${matchThreshold}, count ${matchCount}`);
      let { data: searchData, error: rpcError } = await supabaseAdmin.rpc('match_arcs_rules', {
        query_embedding: queryEmbedding,
        match_threshold: matchThreshold,
        match_count: matchCount,
      });

      // If no results found or very few, try again with lower threshold
      if (!rpcError && (!Array.isArray(searchData) || searchData.length < 2)) {
        matchThreshold = 0.45; // Lower threshold for retry
        console.log(`No/few results found. Retrying with lower threshold ${matchThreshold}`);
        
        const retryResult = await supabaseAdmin.rpc('match_arcs_rules', {
          query_embedding: queryEmbedding,
          match_threshold: matchThreshold,
          match_count: matchCount + 2, // Get more results with lower threshold
        });
        
        // Use retry results if successful
        if (!retryResult.error && Array.isArray(retryResult.data) && retryResult.data.length > 0) {
          searchData = retryResult.data;
          console.log(`Retry found ${searchData.length} results`);
        }
      }

      if (rpcError) {
        console.error('Supabase RPC error:', rpcError);
        throw new Error(`Database search error: ${rpcError.message}`);
      }

      console.log(`RPC function returned ${Array.isArray(searchData) ? searchData.length : 0} results.`);

      // Ensure data is an array before returning
      const results = Array.isArray(searchData) ? searchData as ArcsRuleSearchResult[] : [];

      // 4. Return the results
      console.log(`After dynamic threshold, final results count: ${Array.isArray(searchData) ? searchData.length : 0}`);
      return new Response(JSON.stringify(results), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    } catch (error) {
       console.error('Failed during RPC call or processing:', error);
       throw new Error(`Failed to execute search: ${error.message}`);
    }

  } catch (error) {
    console.error('Main handler error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})

console.log("Vector search function handler registered."); 