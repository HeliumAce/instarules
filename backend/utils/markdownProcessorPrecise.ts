import { unified } from 'unified';
import remarkParse from 'remark-parse';
import { visit } from 'unist-util-visit';
import { toString } from 'mdast-util-to-string';
import type { Root, Content, Heading, Paragraph, List, ListItem } from 'mdast';
import type { Node } from 'unist';

/**
 * Represents a processed chunk of the Markdown document.
 */
export interface Chunk {
    /** The text content of the chunk. */
    content: string;
    /** Metadata associated with the chunk. */
    metadata: {
        /** The most immediate heading preceding the chunk content. */
        source_heading: string | null;
        /** The hierarchy of headings leading to this chunk (e.g., ["Section", "Subsection"]). */
        headings: string[];
        /** The inferred type of content based on headings. */
        content_type: 'rule' | 'card' | 'faq' | 'errata' | 'introduction' | 'other';
        /** Optional: Extracted Card ID if content_type is 'card'. */
        card_id?: string;
    };
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
 * Creates a chunk with the given content and current heading context
 */
function createChunk(content: string, currentHeadings: string[]): Chunk {
    // Clean up content
    content = content.replace(/\n{3,}/g, '\n\n').replace(/ {2,}/g, ' ').trim();
    
    if (!content) return null;
    
    const contentType = determineContentType(currentHeadings);
    const metadata: Chunk['metadata'] = {
        source_heading: currentHeadings.length > 0 ? currentHeadings[currentHeadings.length - 1] : null,
        headings: [...currentHeadings],
        content_type: contentType,
    };
    
    // Extract Card ID for card chunks
    if (contentType === 'card' && metadata.source_heading) {
        const idMatch = metadata.source_heading.match(/\(ID: ([A-Z0-9-]+)\)/);
        if (idMatch) {
            metadata.card_id = idMatch[1];
        }
    }
    
    // Add context from the heading
    if (metadata.source_heading) {
        content = `${metadata.source_heading}\n${content}`;
    }
    
    return { content, metadata };
}

/**
 * Processes Markdown content and splits it into small, precise chunks.
 */
export function processMarkdownAndChunk(markdownContent: string): Chunk[] {
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
        
        // For short paragraphs (< 120 chars), keep as one chunk
        if (text.length < 120) {
            const chunk = createChunk(text, currentHeadings);
            if (chunk) chunks.push(chunk);
            return;
        }
        
        // For longer paragraphs, split into sentences and group them
        const sentences = splitIntoSentences(text);
        
        if (sentences.length <= 1) {
            // If we couldn't split into sentences, keep as one chunk
            const chunk = createChunk(text, currentHeadings);
            if (chunk) chunks.push(chunk);
            return;
        }
        
        // Group sentences into chunks of ~150-200 chars each
        let currentGroup = '';
        
        for (const sentence of sentences) {
            if (currentGroup.length + sentence.length < 200) {
                currentGroup += sentence;
            } else {
                // Create chunk for current group
                if (currentGroup) {
                    const chunk = createChunk(currentGroup, currentHeadings);
                    if (chunk) chunks.push(chunk);
                }
                currentGroup = sentence;
            }
        }
        
        // Add the last group
        if (currentGroup) {
            const chunk = createChunk(currentGroup, currentHeadings);
            if (chunk) chunks.push(chunk);
        }
    }
    
    // Process list items individually or in small groups
    function processList(node: List) {
        if (!('position' in node) || !node.position?.start?.offset || !node.position?.end?.offset) {
            return;
        }
        
        // For small lists (≤ 3 items), keep as one chunk
        if (node.children.length <= 3) {
            const text = markdownContent.substring(
                node.position.start.offset,
                node.position.end.offset
            ).trim();
            
            const chunk = createChunk(text, currentHeadings);
            if (chunk) chunks.push(chunk);
            return;
        }
        
        // For longer lists, create chunks with 1-2 items each
        for (let i = 0; i < node.children.length; i += 2) {
            const items = node.children.slice(i, i + 2);
            
            if (items.length > 0 && 
                'position' in items[0] && items[0].position?.start?.offset &&
                'position' in items[items.length-1] && items[items.length-1].position?.end?.offset) {
                
                const text = markdownContent.substring(
                    items[0].position.start.offset,
                    items[items.length-1].position.end.offset
                ).trim();
                
                const chunk = createChunk(text, currentHeadings);
                if (chunk) chunks.push(chunk);
            }
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
                
                const chunk = createChunk(text, currentHeadings);
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
            
            const chunk = createChunk(text, currentHeadings);
            if (chunk) chunks.push(chunk);
        }
    });
    
    // Filter out very small chunks
    const MIN_CHUNK_CHAR_LENGTH = 15;
    const refinedChunks = chunks.filter(chunk => chunk.content.length >= MIN_CHUNK_CHAR_LENGTH);
    
    console.log(`Processed markdown. Initial chunks: ${chunks.length}, Refined chunks (>=${MIN_CHUNK_CHAR_LENGTH} chars): ${refinedChunks.length}.`);
    return refinedChunks;
}