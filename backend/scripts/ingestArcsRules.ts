import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { processMarkdownAndChunk, Chunk } from '../utils/markdownProcessor.js'; // Import processor and Chunk type
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url'; // Import the necessary function from 'url'
import 'dotenv/config'; // Make sure to install dotenv: npm install dotenv

// Define the expected structure of the data returned by the Edge Function
interface EmbeddingResponse {
    embedding?: number[];
    error?: string;
}

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

// Adjust the relative path to go up THREE levels from dist/backend/scripts
const MARKDOWN_FILE_PATH = path.resolve(__dirname, '../../../src/data/games/arcs/arcs_unified.md');
const EMBEDDINGS_TABLE_NAME = 'arcs_rules_embeddings';
const EDGE_FUNCTION_NAME = 'generate-embeddings';
const CLEAR_TABLE_BEFORE_INGEST = true; // Set to true to wipe table before adding new data
// --- End Configuration ---


// Initialize Supabase client (ensure environment variables are set)
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

async function ingestData() {
    console.log(`Starting ingestion process for: ${MARKDOWN_FILE_PATH}`);

    try {
        // 1. Read and process Markdown file
        console.log('Reading and chunking Markdown file...');
        const markdownContent = await fs.readFile(MARKDOWN_FILE_PATH, 'utf-8');
        const chunks = processMarkdownAndChunk(markdownContent);
        if (chunks.length === 0) {
            console.log("No chunks generated from Markdown file. Exiting.");
            return;
        }
        console.log(`Generated ${chunks.length} chunks.`);

        // 2. Optional: Clear existing data
        if (CLEAR_TABLE_BEFORE_INGEST) {
            console.log(`Clearing existing data from ${EMBEDDINGS_TABLE_NAME}...`);
            const { error: deleteError } = await supabaseAdmin
                .from(EMBEDDINGS_TABLE_NAME)
                .delete()
                .neq('id', '00000000-0000-0000-0000-000000000000'); // Trick to delete all rows without complex matching

            if (deleteError) {
                console.error('Error clearing table:', deleteError);
                throw new Error(`Failed to clear table: ${deleteError.message}`);
            }
            console.log('Table cleared successfully.');
        }

        // 3. Generate embeddings and prepare data for insertion
        console.log('Generating embeddings for each chunk...');
        const rowsToInsert: DbEmbeddingRow[] = [];
        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            console.log(`Processing chunk ${i + 1}/${chunks.length}...`);

            try {
                const { data: embeddingData, error: embeddingError } = await supabaseAdmin.functions.invoke<EmbeddingResponse>(
                    EDGE_FUNCTION_NAME,
                    { body: { inputText: chunk.content } } // Use inputText key
                );

                if (embeddingError || !embeddingData || embeddingData.error || !embeddingData.embedding) {
                    const errorMsg = embeddingError?.message || embeddingData?.error || 'Embedding generation failed';
                    console.error(`  Error embedding chunk ${i + 1}: ${errorMsg}`);
                    errorCount++;
                    continue; // Skip this chunk
                }

                 if (embeddingData.embedding.length !== 384) {
                    console.error(`  Error embedding chunk ${i + 1}: Embedding dimension mismatch. Expected 384, got ${embeddingData.embedding.length}`);
                    errorCount++;
                    continue; // Skip this chunk
                 }


                rowsToInsert.push({
                    content: chunk.content,
                    metadata: chunk.metadata,
                    embedding: embeddingData.embedding,
                });
                successCount++;

            } catch (invokeError: any) {
                console.error(`  Error invoking edge function for chunk ${i + 1}:`, invokeError.message);
                errorCount++;
            }

            // ADD: Delay to prevent rate limiting / overwhelming cold starts
            const DELAY_MS = 100; // Adjust as needed (e.g., 50-250ms)
            await new Promise(resolve => setTimeout(resolve, DELAY_MS));
        }

        console.log(`Embedding generation complete. Success: ${successCount}, Errors: ${errorCount}`);

        // 4. Insert data into Supabase
        if (rowsToInsert.length > 0) {
            // Make sure the previous console log is terminated correctly
            console.log(`Inserting ${rowsToInsert.length} rows into ${EMBEDDINGS_TABLE_NAME}...`);

            // Insert in batches for better performance (optional but recommended for > 100 rows)
            const BATCH_SIZE = 50; // Supabase recommends batches of < 1000, 50-100 is often safe
            for (let i = 0; i < rowsToInsert.length; i += BATCH_SIZE) {
                const batch = rowsToInsert.slice(i, i + BATCH_SIZE);
                console.log(` Inserting batch ${Math.floor(i / BATCH_SIZE) + 1}...`);
                const { error: insertError } = await supabaseAdmin
                    .from(EMBEDDINGS_TABLE_NAME)
                    .insert(batch);

                if (insertError) {
                    console.error('Error inserting batch:', insertError);
                    // Decide how to handle batch errors - stop?, log and continue?
                    // For now, we'll log and stop the script on the first error.
                     throw new Error(`Failed to insert batch: ${insertError.message}`);
                }
            }
             console.log('Data insertion complete.');

        } else {
            console.log('No valid embeddings generated, nothing to insert.');
        }

        console.log('Ingestion process finished successfully.');

    } catch (error: any) {
        console.error('Ingestion process failed:', error.message);
        process.exit(1); // Exit with error code
    }
}

// Run the ingestion function
ingestData();
