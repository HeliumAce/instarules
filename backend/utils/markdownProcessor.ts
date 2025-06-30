import { unified } from 'unified';
import remarkParse from 'remark-parse';
import { visit } from 'unist-util-visit';
import { toString } from 'mdast-util-to-string';
import type { Root, Content, Heading, Paragraph, List, ListItem } from 'mdast';
import type { Node } from 'unist';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Enhanced processor options for file metadata capture
 */
export interface ProcessorOptions {
    /** The source file path (used for extracting filename and calculating hash) */
    filePath?: string;
    /** Override source filename (if not providing filePath) */
    sourceFile?: string;
    /** Override file hash (if not providing filePath) */
    fileHash?: string;
    /** Override last modified timestamp (if not providing filePath) */
    lastModified?: Date;
}

/**
 * Represents a processed chunk of the Markdown document with enhanced metadata.
 * Separates file-level metadata (for dedicated DB columns) from chunk-level metadata (for JSONB).
 */
export interface Chunk {
    /** The text content of the chunk. */
    content: string;
    /** File-level metadata for dedicated database columns */
    fileMetadata: {
        /** Source file name */
        source_file: string;
        /** H1 heading from the file */
        h1_heading: string | null;
        /** Hash of the source file content for change detection */
        file_hash: string;
        /** Last modified timestamp of the source file */
        last_modified: Date;
    };
    /** Chunk-level metadata for JSONB storage - optimized for PostgreSQL queries */
    metadata: {
        /** The most immediate heading preceding the chunk content. */
        source_heading: string | null;
        /** The hierarchy of headings leading to this chunk (e.g., ["Section", "Subsection"]). */
        headings: string[];
        /** The inferred type of content based on headings. */
        content_type: 'rule' | 'card' | 'faq' | 'errata' | 'introduction' | 'other';
        /** Optional: Extracted Card ID if content_type is 'card'. */
        card_id?: string;
        /** JSONB optimized: Character count for chunk size analysis */
        char_count: number;
        /** JSONB optimized: Heading depth of source_heading */
        heading_depth: number;
    };
}

/**
 * Extracts the H1 heading from markdown content
 */
function extractH1Heading(markdownContent: string): string | null {
    const tree: Root = unified().use(remarkParse).parse(markdownContent);
    let h1Heading: string | null = null;
    
    visit(tree, (node: Node) => {
        if (node.type === 'heading') {
            const heading = node as Heading;
            if (heading.depth === 1 && !h1Heading) {
                h1Heading = toString(heading).trim();
            }
        }
    });
    
    return h1Heading;
}

/**
 * Calculates SHA-256 hash of content
 */
function calculateContentHash(content: string): string {
    return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

/**
 * Extracts file metadata from file path
 */
function extractFileMetadata(filePath: string): { sourceFile: string; fileHash: string; lastModified: Date } {
    const sourceFile = path.basename(filePath);
    const content = fs.readFileSync(filePath, 'utf8');
    const fileHash = calculateContentHash(content);
    const stats = fs.statSync(filePath);
    const lastModified = stats.mtime;
    
    return { sourceFile, fileHash, lastModified };
}

/**
 * Determines the content type of a chunk based on its heading hierarchy.
 */
function determineContentType(headings: string[]): Chunk['metadata']['content_type'] {
    const lowerHeadings = headings.map(h => h.toLowerCase());

    if (lowerHeadings.includes('card reference')) return 'card';
    if (lowerHeadings.some(h => h.includes('faq') || h.includes('frequently asked questions'))) return 'faq';
    if (lowerHeadings.some(h => h.includes('errata'))) return 'errata';
    if (lowerHeadings.some(h => h.includes('introduction'))) return 'introduction';
    if (lowerHeadings.some(h => h.includes('rules'))) return 'rule';

    if (lowerHeadings.length > 0) {
        const topLevel = lowerHeadings[0];
        if (topLevel.includes('base game rules')) return 'rule';
        if (topLevel.includes('blighted reach expansion rules')) return 'rule';
    }

    return 'other';
}

/**
 * Gets optimal chunk sizes based on content type
 * Returns { shortThreshold, targetSize, maxSize } for the given content type
 */
function getChunkSizesForContentType(contentType: Chunk['metadata']['content_type']): {
    shortThreshold: number;
    targetSize: number;
    maxSize: number;
} {
    switch (contentType) {
        case 'rule':
            return {
                shortThreshold: 150,  // Keep short rule paragraphs intact
                targetSize: 200,      // Target 200 chars for rules
                maxSize: 250         // Don't exceed 250 for rules
            };
        case 'card':
            return {
                shortThreshold: 100,  // Cards are often concise
                targetSize: 150,      // Target 150 chars for cards
                maxSize: 200         // Don't exceed 200 for cards
            };
        case 'faq':
            return {
                shortThreshold: 180,  // FAQ answers can be longer
                targetSize: 250,      // Target 250 chars for FAQ
                maxSize: 300         // Don't exceed 300 for FAQ
            };
        case 'errata':
            return {
                shortThreshold: 120,  // Errata entries are usually focused
                targetSize: 180,      // Target 180 chars for errata
                maxSize: 220         // Don't exceed 220 for errata
            };
        case 'introduction':
            return {
                shortThreshold: 160,  // Introductions can be descriptive
                targetSize: 220,      // Target 220 chars for introductions
                maxSize: 280         // Don't exceed 280 for introductions
            };
        case 'other':
        default:
            return {
                shortThreshold: 120,  // Default conservative approach
                targetSize: 180,      // Default balanced target
                maxSize: 220         // Default reasonable max
            };
    }
}

/**
 * Creates a chunk with the given content and current heading context
 */
function createChunk(
    content: string, 
    currentHeadings: string[], 
    fileMetadata: { source_file: string; h1_heading: string | null; file_hash: string; last_modified: Date }
): Chunk | null {
    // Clean up content
    content = content.replace(/\n{3,}/g, '\n\n').replace(/ {2,}/g, ' ').trim();
    
    if (!content) return null;
    
    const contentType = determineContentType(currentHeadings);
    const sourceHeading = currentHeadings.length > 0 ? currentHeadings[currentHeadings.length - 1] : null;
    
    // Chunk-level metadata for JSONB storage
    const metadata: Chunk['metadata'] = {
        source_heading: sourceHeading,
        headings: [...currentHeadings],
        content_type: contentType,
        char_count: content.length,
        heading_depth: currentHeadings.length,
    };
    
    // Extract Card ID for card chunks
    if (contentType === 'card' && sourceHeading) {
        const idMatch = sourceHeading.match(/\(ID: ([A-Z0-9-]+)\)/);
        if (idMatch) {
            metadata.card_id = idMatch[1];
        }
    }
    
    // Add context from the heading
    if (sourceHeading) {
        content = `${sourceHeading}\n${content}`;
        // Update char_count after adding heading context
        metadata.char_count = content.length;
    }
    
    return { 
        content, 
        fileMetadata: {
            source_file: fileMetadata.source_file,
            h1_heading: fileMetadata.h1_heading,
            file_hash: fileMetadata.file_hash,
            last_modified: fileMetadata.last_modified,
        },
        metadata 
    };
}

/**
 * Processes Markdown content and splits it into small, precise chunks with enhanced metadata.
 */
export function processMarkdownAndChunk(
    markdownContent: string, 
    options: ProcessorOptions = {}
): Chunk[] {
    // Extract or use provided file metadata
    let fileMetadata: { source_file: string; h1_heading: string | null; file_hash: string; last_modified: Date };
    
    if (options.filePath) {
        // Extract metadata from file path
        const extracted = extractFileMetadata(options.filePath);
        fileMetadata = {
            source_file: extracted.sourceFile,
            h1_heading: extractH1Heading(markdownContent),
            file_hash: extracted.fileHash,
            last_modified: extracted.lastModified,
        };
    } else {
        // Use provided metadata or defaults
        fileMetadata = {
            source_file: options.sourceFile || 'unknown.md',
            h1_heading: options.filePath ? extractH1Heading(markdownContent) : (extractH1Heading(markdownContent) || null),
            file_hash: options.fileHash || calculateContentHash(markdownContent),
            last_modified: options.lastModified || new Date(),
        };
    }
    
    const tree: Root = unified().use(remarkParse).parse(markdownContent);
    const chunks: Chunk[] = [];
    let currentHeadings: string[] = [];

    // Split text into sentences with regex
    function splitIntoSentences(text: string): string[] {
        // This regex splits on sentence boundaries but tries to respect
        // common abbreviations, numbers with decimals, etc.
        return text.match(/[^.!?]+[.!?]+(?:\s|$)/g) || [text];
    }
    
    // Process a paragraph into multiple chunks if needed
    function processParagraph(node: Paragraph) {
        if (!('position' in node) || !node.position?.start?.offset || !node.position?.end?.offset) {
            return;
        }
        
        const text = markdownContent.substring(
            node.position.start.offset,
            node.position.end.offset
        ).trim();
        
        if (!text) return;
        
        // Determine content type and get appropriate chunk sizes
        const contentType = determineContentType(currentHeadings);
        const chunkSizes = getChunkSizesForContentType(contentType);
        
        // For short paragraphs (below threshold), keep as one chunk
        if (text.length < chunkSizes.shortThreshold) {
            const chunk = createChunk(text, currentHeadings, fileMetadata);
            if (chunk) chunks.push(chunk);
            return;
        }
        
        // For longer paragraphs, split into sentences and group them
        const sentences = splitIntoSentences(text);
        
        if (sentences.length <= 1) {
            // If we couldn't split into sentences, keep as one chunk
            const chunk = createChunk(text, currentHeadings, fileMetadata);
            if (chunk) chunks.push(chunk);
            return;
        }
        
        // Group sentences into chunks based on content-type specific target size
        let currentGroup = '';
        
        for (const sentence of sentences) {
            // Check if adding this sentence would exceed our target size
            if (currentGroup.length + sentence.length < chunkSizes.targetSize) {
                currentGroup += sentence;
            } else if (currentGroup.length + sentence.length < chunkSizes.maxSize && currentGroup.length < chunkSizes.targetSize * 0.7) {
                // If we're still under max size and current group is small, add it anyway
                currentGroup += sentence;
            } else {
                // Create chunk for current group
                if (currentGroup) {
                    const chunk = createChunk(currentGroup, currentHeadings, fileMetadata);
                    if (chunk) chunks.push(chunk);
                }
                currentGroup = sentence;
            }
        }
        
        // Add the last group
        if (currentGroup) {
            const chunk = createChunk(currentGroup, currentHeadings, fileMetadata);
            if (chunk) chunks.push(chunk);
        }
    }
    
    // Process list items individually or in small groups
    function processList(node: List) {
        if (!('position' in node) || !node.position?.start?.offset || !node.position?.end?.offset) {
            return;
        }
        
        // Determine content type and get appropriate chunk sizes
        const contentType = determineContentType(currentHeadings);
        const chunkSizes = getChunkSizesForContentType(contentType);
        
        // For small lists, keep as one chunk if under threshold
        if (node.children.length <= 3) {
            const text = markdownContent.substring(
                node.position.start.offset,
                node.position.end.offset
            ).trim();
            
            // Check if the entire list is small enough to be one chunk
            if (text.length < chunkSizes.targetSize) {
                const chunk = createChunk(text, currentHeadings, fileMetadata);
                if (chunk) chunks.push(chunk);
                return;
            }
        }
        
        // For longer lists or large small lists, create chunks based on content type
        let currentItems: any[] = [];
        let currentSize = 0;
        
        for (let i = 0; i < node.children.length; i++) {
            const item = node.children[i];
            
            if ('position' in item && item.position?.start?.offset && item.position?.end?.offset) {
                const itemText = markdownContent.substring(
                    item.position.start.offset,
                    item.position.end.offset
                ).trim();
                
                // Check if adding this item would exceed our target size
                if (currentItems.length > 0 && (currentSize + itemText.length > chunkSizes.targetSize)) {
                    // Create chunk for current items
                    if (currentItems.length > 0) {
                        const startOffset = currentItems[0].position.start.offset;
                        const endOffset = currentItems[currentItems.length - 1].position.end.offset;
                        const text = markdownContent.substring(startOffset, endOffset).trim();
                        
                        const chunk = createChunk(text, currentHeadings, fileMetadata);
                        if (chunk) chunks.push(chunk);
                    }
                    
                    // Start new group
                    currentItems = [item];
                    currentSize = itemText.length;
                } else {
                    // Add to current group
                    currentItems.push(item);
                    currentSize += itemText.length;
                }
            }
        }
        
        // Add the last group
        if (currentItems.length > 0) {
            const startOffset = currentItems[0].position.start.offset;
            const endOffset = currentItems[currentItems.length - 1].position.end.offset;
            const text = markdownContent.substring(startOffset, endOffset).trim();
            
            const chunk = createChunk(text, currentHeadings, fileMetadata);
            if (chunk) chunks.push(chunk);
        }
    }

    // Process the tree
    visit(tree, (node: Node) => {
        if (node.type === 'heading') {
            const heading = node as Heading;
            const headingText = toString(heading).trim();
            
            // Update heading hierarchy
            if (heading.depth === 1) {
                currentHeadings = [headingText];
            } else if (heading.depth === 2) {
                currentHeadings = currentHeadings.slice(0, 1);
                currentHeadings.push(headingText);
            } else if (heading.depth === 3) {
                currentHeadings = currentHeadings.slice(0, 2);
                currentHeadings.push(headingText);
            } else if (heading.depth === 4) {
                currentHeadings = currentHeadings.slice(0, 3);
                currentHeadings.push(headingText);
            }
            
            // Create a chunk for the heading itself
            if ('position' in node && node.position?.start?.offset && node.position?.end?.offset) {
                const text = markdownContent.substring(
                    node.position.start.offset,
                    node.position.end.offset
                ).trim();
                
                const chunk = createChunk(text, currentHeadings, fileMetadata);
                if (chunk) chunks.push(chunk);
            }
        } 
        else if (node.type === 'paragraph') {
            processParagraph(node as Paragraph);
        }
        else if (node.type === 'list') {
            processList(node as List);
        }
        else if ((node.type === 'blockquote' || node.type === 'code') && 
                 'position' in node && node.position?.start?.offset && node.position?.end?.offset) {
            // Process blockquotes and code blocks as single chunks
            const text = markdownContent.substring(
                node.position.start.offset,
                node.position.end.offset
            ).trim();
            
            const chunk = createChunk(text, currentHeadings, fileMetadata);
            if (chunk) chunks.push(chunk);
        }
    });
    
    // Filter out very small chunks
    const MIN_CHUNK_CHAR_LENGTH = 15;
    const refinedChunks = chunks.filter(chunk => chunk.content.length >= MIN_CHUNK_CHAR_LENGTH);
    
    return refinedChunks;
}

/**
 * Enhanced test function to validate content-type specific chunking functionality
 */
export function testEnhancedProcessor() {
    const testMarkdownRule = `# Arcs Base Game Rules

## Core Mechanics

This is a longer rule description that explains how the game mechanics work in detail. Players must follow specific procedures during their turns to ensure proper gameplay flow.

### Resource Management

Players collect resources during their turns using various action cards and board positions.

## Combat Rules

Combat is resolved using dice rolls and modifier cards that affect the outcome.`;

    const testMarkdownCards = `# Arcs Card Reference

## Action Cards

### Leadership Card (ID: L-001)

Gain 2 influence in any city. Draw 1 card.

### Military Card (ID: M-001)

Move 1 ship. Attack with +1 strength.`;

    const testMarkdownFAQ = `# Arcs FAQ

## General Questions

### Can I play multiple action cards in one turn?

No, you can only play one action card per turn unless specifically stated otherwise by another card effect. This limitation helps maintain game balance and prevents overpowered combinations that could break the intended game flow and strategic decision-making process.

### What happens if I run out of cards?

You immediately shuffle your discard pile to form a new draw deck and continue playing normally.`;

    console.log('Testing enhanced processor with content-type specific chunking...');
    
    // Test rule content
    console.log('\n=== TESTING RULE CONTENT ===');
    const ruleChunks = processMarkdownAndChunk(testMarkdownRule, {
        sourceFile: 'arcs_rules_base_game.md',
        fileHash: 'rule123hash',
        lastModified: new Date('2024-01-01')
    });
    
    console.log(`Rule content generated ${ruleChunks.length} chunks`);
    ruleChunks.forEach((chunk, i) => {
        console.log(`  Chunk ${i + 1} (${chunk.metadata.content_type}): ${chunk.metadata.char_count} chars`);
        console.log(`    File Metadata: ${chunk.fileMetadata.source_file}, H1: "${chunk.fileMetadata.h1_heading}"`);
        console.log(`    JSONB Metadata: depth=${chunk.metadata.heading_depth}, heading="${chunk.metadata.source_heading}"`);
    });
    
    // Test card content
    console.log('\n=== TESTING CARD CONTENT ===');
    const cardChunks = processMarkdownAndChunk(testMarkdownCards, {
        sourceFile: 'arcs_cards_base_game.md',
        fileHash: 'card123hash',
        lastModified: new Date('2024-01-01')
    });
    
    console.log(`Card content generated ${cardChunks.length} chunks`);
    cardChunks.forEach((chunk, i) => {
        console.log(`  Chunk ${i + 1} (${chunk.metadata.content_type}): ${chunk.metadata.char_count} chars`);
        console.log(`    File Metadata: ${chunk.fileMetadata.source_file}, H1: "${chunk.fileMetadata.h1_heading}"`);
        console.log(`    JSONB Metadata: depth=${chunk.metadata.heading_depth}, card_id="${chunk.metadata.card_id || 'none'}"`);
    });
    
    // Test FAQ content
    console.log('\n=== TESTING FAQ CONTENT ===');
    const faqChunks = processMarkdownAndChunk(testMarkdownFAQ, {
        sourceFile: 'arcs_faq_base_game.md',
        fileHash: 'faq123hash',
        lastModified: new Date('2024-01-01')
    });
    
    console.log(`FAQ content generated ${faqChunks.length} chunks`);
    faqChunks.forEach((chunk, i) => {
        console.log(`  Chunk ${i + 1} (${chunk.metadata.content_type}): ${chunk.metadata.char_count} chars`);
        console.log(`    File Metadata: ${chunk.fileMetadata.source_file}, H1: "${chunk.fileMetadata.h1_heading}"`);
        console.log(`    JSONB Metadata: depth=${chunk.metadata.heading_depth}, headings=[${chunk.metadata.headings.join(', ')}]`);
    });
    
    // Enhanced metadata structure demonstration
    console.log('\n=== METADATA SEPARATION DEMONSTRATION ===');
    if (ruleChunks.length > 0) {
        const sampleChunk = ruleChunks[0];
        console.log('📊 FILE-LEVEL METADATA (Dedicated DB Columns):');
        console.log(`   source_file: "${sampleChunk.fileMetadata.source_file}"`);
        console.log(`   h1_heading: "${sampleChunk.fileMetadata.h1_heading}"`);
        console.log(`   file_hash: "${sampleChunk.fileMetadata.file_hash}"`);
        console.log(`   last_modified: ${sampleChunk.fileMetadata.last_modified.toISOString()}`);
        
        console.log('\n🎯 CHUNK-LEVEL METADATA (JSONB Storage):');
        console.log(`   content_type: "${sampleChunk.metadata.content_type}"`);
        console.log(`   source_heading: "${sampleChunk.metadata.source_heading}"`);
        console.log(`   char_count: ${sampleChunk.metadata.char_count}`);
        console.log(`   heading_depth: ${sampleChunk.metadata.heading_depth}`);
        console.log(`   headings: [${sampleChunk.metadata.headings.map(h => `"${h}"`).join(', ')}]`);
    }
    
    // Summary of chunk size strategies
    console.log('\n=== CHUNK SIZE STRATEGY SUMMARY ===');
    const contentTypes: Chunk['metadata']['content_type'][] = ['rule', 'card', 'faq', 'errata', 'introduction', 'other'];
    contentTypes.forEach(type => {
        const sizes = getChunkSizesForContentType(type);
        console.log(`${type}: target=${sizes.targetSize}, threshold=${sizes.shortThreshold}, max=${sizes.maxSize}`);
    });
    
    console.log('\n✅ Content-type specific chunking test complete!');
    return { ruleChunks, cardChunks, faqChunks };
}

// Uncomment the line below to run the test when this file is executed directly
// testEnhancedProcessor();