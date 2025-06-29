import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { processMarkdownAndChunk, Chunk } from '../utils/markdownProcessor.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

// Get the directory name using the ES Module pattern
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the directory containing individual Arcs markdown files
const ARCS_DATA_DIR = path.resolve(__dirname, '../../src/data/games/arcs');

// All 9 Arcs markdown files with their natural language mappings
const ARCS_FILE_MAPPINGS = {
    // Rules files
    'base_game_rules': 'arcs_rules_base_game.md',
    'base_rules': 'arcs_rules_base_game.md',
    'core_rules': 'arcs_rules_base_game.md',
    'blighted_reach_rules': 'arcs_rules_blighted_reach.md',
    'expansion_rules': 'arcs_rules_blighted_reach.md',
    'br_rules': 'arcs_rules_blighted_reach.md',
    
    // Card files
    'base_game_cards': 'arcs_cards_base_game.md',
    'base_cards': 'arcs_cards_base_game.md',
    'core_cards': 'arcs_cards_base_game.md',
    'blighted_reach_cards': 'arcs_cards_blighted_reach.md',
    'expansion_cards': 'arcs_cards_blighted_reach.md',
    'br_cards': 'arcs_cards_blighted_reach.md',
    'leaders_and_lore': 'arcs_cards_leaders_and_lore.md',
    'leaders': 'arcs_cards_leaders_and_lore.md',
    'lore_cards': 'arcs_cards_leaders_and_lore.md',
    'errata': 'arcs_cards_errata.md',
    'card_errata': 'arcs_cards_errata.md',
    
    // FAQ files
    'base_game_faq': 'arcs_faq_base_game.md',
    'base_faq': 'arcs_faq_base_game.md',
    'core_faq': 'arcs_faq_base_game.md',
    'blighted_reach_faq': 'arcs_faq_blighted_reach.md',
    'expansion_faq': 'arcs_faq_blighted_reach.md',
    'br_faq': 'arcs_faq_blighted_reach.md',
    'cards_faq': 'arcs_cards_faq.md',
    'card_faq': 'arcs_cards_faq.md'
};

// Predefined file groups for common operations
const FILE_GROUPS = {
    'all_rules': ['arcs_rules_base_game.md', 'arcs_rules_blighted_reach.md'],
    'all_cards': ['arcs_cards_base_game.md', 'arcs_cards_blighted_reach.md', 'arcs_cards_leaders_and_lore.md', 'arcs_cards_errata.md'],
    'all_faq': ['arcs_faq_base_game.md', 'arcs_faq_blighted_reach.md', 'arcs_cards_faq.md'],
    'base_game': ['arcs_rules_base_game.md', 'arcs_cards_base_game.md', 'arcs_faq_base_game.md'],
    'blighted_reach': ['arcs_rules_blighted_reach.md', 'arcs_cards_blighted_reach.md', 'arcs_faq_blighted_reach.md'],
    'expansion': ['arcs_rules_blighted_reach.md', 'arcs_cards_blighted_reach.md', 'arcs_faq_blighted_reach.md'],
    'all_files': Object.values(ARCS_FILE_MAPPINGS).filter((v, i, a) => a.indexOf(v) === i) // Remove duplicates
};

const EMBEDDINGS_TABLE_NAME = 'arcs_rules_embeddings_v2';
const PROCESSING_BATCH_SIZE = 5; // Reduced for Free plan limits

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

/**
 * Parse natural language command to extract file targets
 */
export function parseIngestionCommand(command: string): string[] {
    const lowerCommand = command.toLowerCase();
    const targetFiles: string[] = [];
    
    // Check for group matches first
    for (const [groupName, files] of Object.entries(FILE_GROUPS)) {
        if (lowerCommand.includes(groupName.replace('_', ' ')) || lowerCommand.includes(groupName)) {
            targetFiles.push(...files);
            break; // Use first match to avoid duplicates
        }
    }
    
    // If no group match, check individual file mappings
    if (targetFiles.length === 0) {
        for (const [alias, filename] of Object.entries(ARCS_FILE_MAPPINGS)) {
            if (lowerCommand.includes(alias.replace('_', ' ')) || lowerCommand.includes(alias)) {
                if (!targetFiles.includes(filename)) {
                    targetFiles.push(filename);
                }
            }
        }
    }
    
    // If still no matches, try to extract from common phrases
    if (targetFiles.length === 0) {
        if (lowerCommand.includes('everything') || lowerCommand.includes('all')) {
            targetFiles.push(...FILE_GROUPS.all_files);
        }
    }
    
    return [...new Set(targetFiles)]; // Remove duplicates
}

/**
 * Display available ingestion commands
 */
export function listIngestionCommands(): string[] {
    return [
        // Individual file commands
        'Re-ingest base game rules',
        'Re-ingest blighted reach rules', 
        'Re-ingest base game cards',
        'Re-ingest blighted reach cards',
        'Re-ingest leaders and lore',
        'Re-ingest card errata',
        'Re-ingest base game FAQ',
        'Re-ingest blighted reach FAQ',
        'Re-ingest cards FAQ',
        
        // Group commands
        'Re-ingest all rules',
        'Re-ingest all cards', 
        'Re-ingest all FAQ',
        'Re-ingest base game content',
        'Re-ingest blighted reach content',
        'Re-ingest everything',
        
        // Utility commands
        'Check file status',
        'List changed files',
        'Validate all files'
    ];
}

/**
 * Main selective ingestion function
 */
export async function executeIngestionCommand(command: string): Promise<{
    success: boolean;
    message: string;
    filesProcessed: string[];
    chunksProcessed: number;
    errors: string[];
}> {
    try {
        console.log(`🚀 Executing ingestion command: "${command}"\n`);
        
        // Parse command to get target files
        const targetFiles = parseIngestionCommand(command);
        
        if (targetFiles.length === 0) {
            return {
                success: false,
                message: 'No files matched the command. Use "list commands" to see available options.',
                filesProcessed: [],
                chunksProcessed: 0,
                errors: ['No files matched the command']
            };
        }
        
        console.log(`📋 Target files identified: ${targetFiles.join(', ')}\n`);
        
        // Validate files exist
        const validFiles: string[] = [];
        const errors: string[] = [];
        
        for (const fileName of targetFiles) {
            const filePath = path.join(ARCS_DATA_DIR, fileName);
            try {
                await fs.access(filePath);
                validFiles.push(filePath);
            } catch (error) {
                errors.push(`File not found: ${fileName}`);
                console.warn(`⚠️  File not found: ${fileName}`);
            }
        }
        
        if (validFiles.length === 0) {
            return {
                success: false,
                message: 'No valid files found to process.',
                filesProcessed: [],
                chunksProcessed: 0,
                errors
            };
        }
        
        console.log(`📚 Processing ${validFiles.length} files...\n`);
        
        // Import change detection functions from the main ingestion script
        const { removeExistingChunks } = await import('../scripts/ingestArcsRules.js');
        
        // For selective ingestion, we force processing of specified files
        console.log('🔄 Force processing selected files (bypassing change detection)...\n');
        
        // Remove existing chunks for selected files
        const fileNames = validFiles.map(f => path.basename(f));
        await removeExistingChunks(fileNames);
        
        // Process the selected files
        const allChunks: Chunk[] = [];
        for (const filePath of validFiles) {
            const markdownContent = await fs.readFile(filePath, 'utf-8');
            console.log(`📄 Processing ${path.basename(filePath)}...`);
            
            const chunks = processMarkdownAndChunk(markdownContent, { filePath });
            console.log(`   Generated ${chunks.length} chunks`);
            allChunks.push(...chunks);
        }
        
        if (allChunks.length === 0) {
            return {
                success: false,
                message: 'No chunks generated from the selected files.',
                filesProcessed: fileNames,
                chunksProcessed: 0,
                errors: [...errors, 'No chunks generated']
            };
        }
        
        // Prepare database rows
        const dbRows = allChunks.map(chunk => ({
            content: chunk.content,
            metadata: chunk.metadata,
            source_file: chunk.fileMetadata.source_file,
            h1_heading: chunk.fileMetadata.h1_heading,
            file_hash: chunk.fileMetadata.file_hash,
            last_modified: chunk.fileMetadata.last_modified,
        }));
        
        // Generate embeddings and insert data in batches
        console.log(`\n🔢 Generating embeddings and inserting data...`);
        let successCount = 0;
        let errorCount = 0;
        
        for (let i = 0; i < dbRows.length; i += PROCESSING_BATCH_SIZE) {
            const batch = dbRows.slice(i, i + PROCESSING_BATCH_SIZE);
            const batchTexts = batch.map(row => row.content);
            
            try {
                console.log(`   Processing batch ${Math.floor(i / PROCESSING_BATCH_SIZE) + 1}/${Math.ceil(dbRows.length / PROCESSING_BATCH_SIZE)} (${batch.length} chunks)...`);
                
                            // Generate embeddings using Supabase Native AI
            const { data, error } = await supabaseAdmin.functions.invoke('generate-embeddings-native', {
                body: { inputText: batchTexts }
                });
                
                if (error) {
                    throw new Error(`Failed to generate embeddings: ${error.message}`);
                }
                
                if (!data || !data.embeddings) {
                    throw new Error('Invalid response from generate-embeddings function');
                }
                
                // Prepare rows with embeddings for insertion
                const rowsWithEmbeddings = batch.map((row, index) => ({
                    ...row,
                    embedding: data.embeddings[index],
                }));
                
                // Insert into v2 table
                const { error: insertError } = await supabaseAdmin
                    .from(EMBEDDINGS_TABLE_NAME)
                    .insert(rowsWithEmbeddings);
                
                if (insertError) {
                    console.error(`❌ Failed to insert batch: ${insertError.message}`);
                    errorCount += batch.length;
                    errors.push(`Failed to insert batch: ${insertError.message}`);
                } else {
                    successCount += batch.length;
                    console.log(`   ✅ Inserted ${batch.length} chunks`);
                }
            } catch (error: any) {
                console.error(`❌ Error processing batch: ${error.message}`);
                errorCount += batch.length;
                errors.push(`Error processing batch: ${error.message}`);
            }
            
            // Add delay between batches
            if (i + PROCESSING_BATCH_SIZE < dbRows.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        
        // Final summary
        const successRate = ((successCount / (successCount + errorCount)) * 100).toFixed(1);
        console.log(`\n🎉 Selective Ingestion Complete!`);
        console.log(`   ✅ Successfully processed: ${successCount} chunks`);
        console.log(`   ❌ Failed to process: ${errorCount} chunks`);
        console.log(`   📊 Success rate: ${successRate}%`);
        
        return {
            success: successCount > 0,
            message: `Successfully processed ${successCount} chunks from ${fileNames.length} files (${successRate}% success rate)`,
            filesProcessed: fileNames,
            chunksProcessed: successCount,
            errors
        };
        
    } catch (error: any) {
        console.error(`💥 Selective ingestion failed: ${error.message}`);
        return {
            success: false,
            message: `Ingestion failed: ${error.message}`,
            filesProcessed: [],
            chunksProcessed: 0,
            errors: [error.message]
        };
    }
}

// Export utility functions for use in other modules
export { ARCS_FILE_MAPPINGS, FILE_GROUPS }; 