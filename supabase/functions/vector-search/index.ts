// supabase/functions/vector-search/index.ts

import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Define required types
interface VectorSearchResult {
  id: string;
  content: string;
  metadata: Record<string, any>;
  source_file: string;
  h1_heading: string;
  similarity: number;
}

// Add CORS headers helper
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

console.log("Vector search function initializing with Supabase Native AI...");

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 0. Initialize Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
       { auth: { persistSession: false } }
    );

    // 1. Extract query from request body
    const { query } = await req.json();
    if (!query || typeof query !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing or invalid "query" in request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    console.log(`Received query: "${query}"`);

    // 2. Generate embedding for the query using Supabase Native AI
    let queryEmbedding: number[];
    try {
      console.log('Generating query embedding with Supabase Native AI...');
      
      // Use Supabase AI Session (same as our working embedding generation)
      const session = new Supabase.ai.Session('gte-small');
      const embedding = await session.run(query, {
        mean_pool: true,
        normalize: true,
      });
      
      queryEmbedding = embedding;
      
      console.log(`Generated embedding with dimension: ${queryEmbedding.length}`);
      if (queryEmbedding.length !== 384) { // Dimension for gte-small
           throw new Error(`Embedding dimension mismatch. Expected 384, got ${queryEmbedding.length}`);
       }
    } catch (error) {
      console.error('Failed to generate query embedding:', error);
      throw new Error(`Failed to generate embedding: ${error.message}`);
    }

    // 3. Call the enhanced Supabase RPC function with dynamic threshold
    let matchThreshold = 0.50; // Initial threshold
    let matchCount = 8;      // Increased from 5

    try {
      console.log(`Calling RPC function 'match_arcs_rules_v2' with threshold ${matchThreshold}, count ${matchCount}`);
      
      // Extract query features to determine search parameters
      const isEnumeration = query.toLowerCase().match(/how many|list all|what are all|count/i) !== null;
      const isCardEnumeration = isEnumeration && query.toLowerCase().match(/cards?|types?/i) !== null;
      const isReasoning = query.toLowerCase().match(/why|when would|if i|what happens if|explain how/i) !== null;
      const isComparison = query.toLowerCase().match(/difference between|compared to|versus|vs|instead of/i) !== null;
      const isInteraction = query.toLowerCase().match(/interact|work with|combined|together/i) !== null;
      
      // Adjust threshold and count based on question type
      if (isCardEnumeration) {
        // Card enumeration needs many results with lower threshold
        matchThreshold = 0.42; // Lower threshold to catch more card listings
        matchCount = 18;     // More results to ensure complete listings
      } else if (isEnumeration) {
        // Regular enumeration
        matchThreshold = 0.45;
        matchCount = 15;
      } else if (isReasoning || isComparison || isInteraction) {
        // Complex reasoning needs more diverse, high-quality results
        matchThreshold = 0.52; // Higher threshold for more relevant results
        matchCount = 12;     // More results to get comprehensive context
      }
      
      let { data: searchData, error: rpcError } = await supabaseAdmin.rpc('match_arcs_rules_v2', {
        query_embedding: queryEmbedding,
        match_threshold: matchThreshold,
        match_count: matchCount,
      });

      // If no results found or very few, try again with lower threshold
      if (!rpcError && (!Array.isArray(searchData) || searchData.length < 2)) {
        matchThreshold = 0.45; // Lower threshold for retry
        console.log(`No/few results found. Retrying with lower threshold ${matchThreshold}`);
        
        const retryResult = await supabaseAdmin.rpc('match_arcs_rules_v2', {
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
      const results = Array.isArray(searchData) ? searchData as VectorSearchResult[] : [];

      // 4. Return the results with enhanced metadata
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