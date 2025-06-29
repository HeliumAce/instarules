#!/usr/bin/env node

import { executeIngestionCommand, listIngestionCommands, parseIngestionCommand } from '../services/ingestionService.js';
import { detectFileChanges } from './ingestArcsRules.js';
import * as path from 'path';
import * as fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ARCS_DATA_DIR = path.resolve(__dirname, '../../src/data/games/arcs');

// All 9 Arcs markdown files
const ARCS_MARKDOWN_FILES = [
    'arcs_rules_base_game.md',
    'arcs_rules_blighted_reach.md',
    'arcs_cards_base_game.md',
    'arcs_cards_blighted_reach.md',
    'arcs_cards_leaders_and_lore.md',
    'arcs_cards_errata.md',
    'arcs_faq_base_game.md',
    'arcs_faq_blighted_reach.md',
    'arcs_cards_faq.md'
];

/**
 * Display help information
 */
function showHelp() {
    console.log(`
🚀 MCP-Enhanced Arcs Ingestion CLI

USAGE:
  node mcpIngestion.ts <command>

EXAMPLES:
  node mcpIngestion.ts "re-ingest base game rules"
  node mcpIngestion.ts "re-ingest all cards"
  node mcpIngestion.ts "re-ingest blighted reach content"
  node mcpIngestion.ts "check file status"
  node mcpIngestion.ts "list commands"

AVAILABLE COMMANDS:`);

    const commands = listIngestionCommands();
    commands.forEach(cmd => {
        console.log(`  • ${cmd}`);
    });

    console.log(`
UTILITY COMMANDS:
  • help - Show this help message
  • list commands - List all available commands
  • check file status - Check which files have changed
  • validate files - Parse command to see which files would be processed

For more information, see: tasks/mcp-setup-guide.md
`);
}

/**
 * Check file status - show which files have changed
 */
async function checkFileStatus() {
    console.log('🔍 Checking file status...\n');
    
    try {
        // Get all file paths
        const validFiles: string[] = [];
        for (const fileName of ARCS_MARKDOWN_FILES) {
            const filePath = path.join(ARCS_DATA_DIR, fileName);
            try {
                await fs.access(filePath);
                validFiles.push(filePath);
            } catch (error) {
                console.warn(`⚠️  File not found: ${fileName}`);
            }
        }

        if (validFiles.length === 0) {
            console.log('❌ No valid files found!');
            return;
        }

        // Use detectFileChanges from the main ingestion script
        const fileChanges = await detectFileChanges(validFiles);
        
        console.log('\n📊 File Status Summary:');
        fileChanges.forEach(fileChange => {
            const statusIcon = fileChange.status === 'new' ? '🆕' : 
                              fileChange.status === 'changed' ? '📝' : '✅';
            console.log(`  ${statusIcon} ${fileChange.fileName}: ${fileChange.status.toUpperCase()}`);
            
            if (fileChange.status === 'changed' && fileChange.existingHash) {
                console.log(`      Hash: ${fileChange.currentHash.substring(0, 8)}... (was: ${fileChange.existingHash.substring(0, 8)}...)`);
            }
        });

        const newCount = fileChanges.filter(f => f.status === 'new').length;
        const changedCount = fileChanges.filter(f => f.status === 'changed').length;
        const unchangedCount = fileChanges.filter(f => f.status === 'unchanged').length;
        
        console.log(`\n📈 Summary: ${newCount} new, ${changedCount} changed, ${unchangedCount} unchanged`);
        
        if (newCount > 0 || changedCount > 0) {
            console.log('\n💡 Tip: Run "node ingestArcsRules.ts" to process changed files automatically');
        } else {
            console.log('\n🎉 All files are up to date!');
        }
        
    } catch (error: any) {
        console.error(`❌ Error checking file status: ${error.message}`);
    }
}

/**
 * Validate which files would be processed by a command
 */
function validateCommand(command: string) {
    console.log(`🔍 Validating command: "${command}"\n`);
    
    const targetFiles = parseIngestionCommand(command);
    
    if (targetFiles.length === 0) {
        console.log('❌ No files matched this command.');
        console.log('\n💡 Try one of these commands:');
        listIngestionCommands().slice(0, 5).forEach(cmd => {
            console.log(`  • ${cmd}`);
        });
        console.log('  • ... (use "list commands" to see all)');
    } else {
        console.log(`✅ Command would process ${targetFiles.length} files:`);
        targetFiles.forEach(file => {
            console.log(`  📄 ${file}`);
        });
        
        console.log(`\n💡 To execute this command, run:`);
        console.log(`  node mcpIngestion.ts "${command}"`);
    }
}

/**
 * Main CLI function
 */
async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        showHelp();
        return;
    }
    
    const command = args.join(' ').toLowerCase().trim();
    
    // Handle utility commands
    if (command === 'help' || command === '--help' || command === '-h') {
        showHelp();
        return;
    }
    
    if (command === 'list commands' || command === 'list') {
        console.log('📋 Available MCP Ingestion Commands:\n');
        listIngestionCommands().forEach((cmd, i) => {
            console.log(`${(i + 1).toString().padStart(2, ' ')}. ${cmd}`);
        });
        console.log('\n💡 Use any of these commands with: node mcpIngestion.ts "<command>"');
        return;
    }
    
    if (command === 'check file status' || command === 'status' || command === 'check') {
        await checkFileStatus();
        return;
    }
    
    if (command.startsWith('validate ')) {
        const targetCommand = command.replace('validate ', '');
        validateCommand(targetCommand);
        return;
    }
    
    // Handle ingestion commands
    console.log('🚀 MCP-Enhanced Selective Ingestion\n');
    
    try {
        const result = await executeIngestionCommand(command);
        
        if (result.success) {
            console.log(`\n✅ ${result.message}`);
            if (result.filesProcessed.length > 0) {
                console.log(`📁 Files processed: ${result.filesProcessed.join(', ')}`);
            }
        } else {
            console.error(`\n❌ ${result.message}`);
            if (result.errors.length > 0) {
                console.error('Errors:');
                result.errors.forEach(error => console.error(`  • ${error}`));
            }
        }
        
    } catch (error: any) {
        console.error(`💥 CLI execution failed: ${error.message}`);
        process.exit(1);
    }
}

// Run CLI if called directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
    main().catch(error => {
        console.error('💥 Unexpected error:', error);
        process.exit(1);
    });
} 