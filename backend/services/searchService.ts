// backend/services/searchService.ts

import { createClient, SupabaseClient } from '@supabase/supabase-js';
// Import the main Chunk type
import type { Chunk } from '../utils/markdownProcessor.js';
import { VectorSearchResult } from '../../src/types/search.js';
import OpenAI from 'openai';
import 'dotenv/config';

// VectorSearchResult type now imported from centralized types
// Note: Using VectorSearchResult instead of ArcsRuleSearchResult for consistency

// Initialize Supabase client (ensure environment variables are set)
// Use Service Role Key for backend operations
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
    throw new Error("Missing environment variable SUPABASE_URL");
}
if (!supabaseServiceKey) {
     throw new Error("Missing environment variable SUPABASE_SERVICE_ROLE_KEY. This key is required for backend operations.");
}

// Create a single Supabase client instance for this service
const supabaseAdmin: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: false, // Don't persist auth sessions server-side for service roles
    }
});

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// OpenAI embedding model to use
const OPENAI_MODEL = 'text-embedding-3-small';

/**
 * Performs a vector search on the Arcs rules embeddings.
 *
 * @param query - The user's search query string.
 * @param matchThreshold - The minimum cosine similarity threshold (e.g., 0.75).
 * @param matchCount - The maximum number of results to return (e.g., 5).
 * @returns A promise that resolves to an array of search results.
 * @throws An error if embedding generation or database query fails.
 */
export async function vectorSearchArcsRules(
    query: string,
    matchThreshold: number = 0.50, // Default threshold
    matchCount: number = 8        // Default number of results
): Promise<VectorSearchResult[]> {
    // console.log(`Performing vector search for query: "${query}"`);

    // 1. Generate embedding for the query using OpenAI
    let queryEmbedding: number[];
    try {
        // console.log(`Generating embedding using OpenAI ${OPENAI_MODEL}...`);
        
        const response = await openai.embeddings.create({
            model: OPENAI_MODEL,
            input: query,
            encoding_format: "float",
        });
        
        queryEmbedding = response.data[0].embedding;
        
        // Verify the embedding dimensions
        if (queryEmbedding.length !== 1536) {
            // console.error(`Embedding dimension mismatch. Expected 1536, got ${queryEmbedding.length}`);
            throw new Error(`Embedding dimension mismatch. Expected 1536, got ${queryEmbedding.length}`);
        }
        
        // console.log("Successfully generated query embedding.");

    } catch (error: any) {
        // console.error('Failed to generate query embedding:', error);
        throw new Error(`Failed to generate embedding for query: ${error.message}`);
    }

    // 2. Call the SQL function via RPC
    try {
        const { data: searchData, error: rpcError } = await supabaseAdmin.rpc<'match_arcs_rules', VectorSearchResult[]>(
            'match_arcs_rules', // The name of the SQL function
            {
                query_embedding: queryEmbedding,
                match_threshold: matchThreshold,
                match_count: matchCount,
            }
        );

        if (rpcError) {
            // console.error('Supabase RPC error:', rpcError);
            throw new Error(`Database search error: ${rpcError.message}`);
        }

        // Check if searchData is an array before accessing length
        const resultCount = Array.isArray(searchData) ? searchData.length : 0;
        // console.log(`Found ${resultCount} potential matches.`);

        if (!Array.isArray(searchData) || searchData.length === 0) {
            return [];
        }

        // Validate the structure of the first item if data exists (optional sanity check)
        const firstItem = searchData[0];
        if (typeof firstItem.id !== 'string' || typeof firstItem.content !== 'string' || typeof firstItem.similarity !== 'number' || typeof firstItem.metadata !== 'object') {
             // console.warn('RPC returned data with unexpected structure.', firstItem);
             // Depending on strictness, you might throw an error or filter invalid items
        }

        return searchData as VectorSearchResult[]; // Cast should be safe after checks

    } catch (error: any) {
        // console.error('Failed to perform vector search:', error);
        throw new Error(`Failed to execute search: ${error.message}`);
    }
}