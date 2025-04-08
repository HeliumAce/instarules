import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { processMarkdownAndChunk, Chunk } from '../utils/markdownProcessorPrecise.js'; // Import processor and Chunk type
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import OpenAI from 'openai';

// Define the structure for inserting into the database table
interface DbEmbeddingRow {
    content: string;
    metadata: Chunk['metadata']; // Use the metadata type from the imported Chunk interface
    embedding: number[];
}

// --- Configuration ---
// Get the directory name using the ES Module pattern
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Adjust the relative path to find the markdown file properly
const MARKDOWN_FILE_PATH = path.resolve(__dirname, '../../../src/data/games/arcs/arcs_unified.md');
// Alternatively, check if the file exists at these paths and use the first one that exists
const ALTERNATIVE_PATHS = [
  path.resolve(__dirname, '../../../src/data/games/arcs/arcs_unified.md'),
  path.resolve(__dirname, '../../src/data/games/arcs/arcs_unified.md'),
  path.resolve(__dirname, '../../data/games/arcs/arcs_unified.md'),
  path.resolve(__dirname, '../data/games/arcs/arcs_unified.md'),
];

// Function to check if file exists at any of the alternative paths
async function findValidMarkdownPath() {
  // First check the original path
  try {
    await fs.access(MARKDOWN_FILE_PATH);
    return MARKDOWN_FILE_PATH;
  } catch (error) {
  }

  // Try alternative paths
  for (const path of ALTERNATIVE_PATHS) {
    try {
      await fs.access(path);
      return path;
    } catch (error) {
    }
  }

  // If we get here, no valid path was found
  throw new Error(`Markdown file not found at any of the expected locations. Please ensure the file exists at one of these paths: 
    ${[MARKDOWN_FILE_PATH, ...ALTERNATIVE_PATHS].join('\n    ')}`);
}

const EMBEDDINGS_TABLE_NAME = 'arcs_rules_embeddings';
const CLEAR_TABLE_BEFORE_INGEST = true; // Set to true to wipe table before adding new data
const OPENAI_MODEL = 'text-embedding-3-small'; // OpenAI embedding model to use
const EMBEDDING_BATCH_SIZE = 10; // Number of chunks to process in each batch

// --- End Configuration ---

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase URL and Service Role Key must be provided in environment variables.");
}

const supabaseAdmin: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: false,
    }
});

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function ingestData() {
    try {
        // Find the valid markdown file path
        const markdownFilePath = await findValidMarkdownPath();

        // 1. Read and process Markdown file
        const markdownContent = await fs.readFile(markdownFilePath, 'utf-8');
        const chunks = processMarkdownAndChunk(markdownContent);
        if (chunks.length === 0) {
            return;
        }

        // 2. Optional: Clear existing data
        if (CLEAR_TABLE_BEFORE_INGEST) {
            const { error: deleteError } = await supabaseAdmin
                .from(EMBEDDINGS_TABLE_NAME)
                .delete()
                .neq('id', '00000000-0000-0000-0000-000000000000'); // Trick to delete all rows

            if (deleteError) {
                throw new Error(`Failed to clear table: ${deleteError.message}`);
            }
        }

        // 3. Generate embeddings and prepare data for insertion
        const rowsToInsert: DbEmbeddingRow[] = [];
        let successCount = 0;
        let errorCount = 0;

        // Process chunks in batches
        for (let i = 0; i < chunks.length; i += EMBEDDING_BATCH_SIZE) {
            const batchChunks = chunks.slice(i, i + EMBEDDING_BATCH_SIZE);
            
            try {
                const batchTexts = batchChunks.map(chunk => chunk.content);
                
                // Generate embeddings using OpenAI API
                const response = await openai.embeddings.create({
                    model: OPENAI_MODEL,
                    input: batchTexts,
                    encoding_format: "float",
                });
                
                // Process the response and prepare data for insertion
                response.data.forEach((item, index) => {
                    rowsToInsert.push({
                        content: batchChunks[index].content,
                        metadata: batchChunks[index].metadata,
                        embedding: item.embedding,
                    });
                    successCount++;
                });
            } catch (error: any) {
                errorCount += batchChunks.length;
            }
            
            // Add a small delay between batches to avoid rate limiting
            if (i + EMBEDDING_BATCH_SIZE < chunks.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        // 4. Insert data into Supabase
        if (rowsToInsert.length > 0) {
            // Insert in batches for better performance
            const INSERT_BATCH_SIZE = 50; // Supabase recommends batches of < 1000
            for (let i = 0; i < rowsToInsert.length; i += INSERT_BATCH_SIZE) {
                const batch = rowsToInsert.slice(i, i + INSERT_BATCH_SIZE);
                const { error: insertError } = await supabaseAdmin
                    .from(EMBEDDINGS_TABLE_NAME)
                    .insert(batch);

                if (insertError) {
                    throw new Error(`Failed to insert batch: ${insertError.message}`);
                }
            }
        }
    } catch (error: any) {
        process.exit(1); // Exit with error code
    }
}

// Run the ingestion function
ingestData();
