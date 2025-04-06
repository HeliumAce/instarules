import { unified } from 'unified';
import remarkParse from 'remark-parse';
import { visit } from 'unist-util-visit';
import { toString } from 'mdast-util-to-string';
import type { Root, Content, Heading } from 'mdast'; // Import specific types for better type safety
import type { Node } from 'unist'; // Import the base Node type

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
        // Add other potential metadata fields here if needed later
    };
}

/**
 * Determines the content type of a chunk based on its heading hierarchy.
 * @param headings - An array of heading strings representing the path to the chunk.
 * @returns The inferred content type.
 */
function determineContentType(headings: string[]): Chunk['metadata']['content_type'] {
    const lowerHeadings = headings.map(h => h.toLowerCase());

    if (lowerHeadings.includes('card reference')) return 'card';
    if (lowerHeadings.some(h => h.includes('faq') || h.includes('frequently asked questions'))) return 'faq';
    if (lowerHeadings.some(h => h.includes('errata'))) return 'errata';
    if (lowerHeadings.some(h => h.includes('introduction'))) return 'introduction';
    // More specific rule checks can go here if needed (e.g., based on keywords)
    if (lowerHeadings.some(h => h.includes('rules'))) return 'rule'; // Default to 'rule' if 'rules' is mentioned

    // Fallback based on top-level heading
    if (lowerHeadings.length > 0) {
        const topLevel = lowerHeadings[0];
        if (topLevel.includes('base game rules')) return 'rule';
        if (topLevel.includes('blighted reach expansion rules')) return 'rule';
    }

    return 'other'; // Default if no specific type is identified
}

/**
 * Processes Markdown content and splits it into semantically meaningful chunks.
 * Chunks are primarily based on heading levels (## and ###).
 * @param markdownContent - The raw Markdown string.
 * @returns An array of processed Chunk objects.
 */
export function processMarkdownAndChunk(markdownContent: string): Chunk[] {
    const tree: Root = unified().use(remarkParse).parse(markdownContent);
    const chunks: Chunk[] = [];
    let currentHeadings: string[] = []; // Tracks the current heading hierarchy
    let currentChunkNodes: Content[] = []; // Nodes belonging to the current chunk being built
    let startOffsetOfCurrentChunk = 0;

    /**
     * Finalizes the current chunk being built and adds it to the chunks array.
     */
    function finalizeChunk() {
        if (currentChunkNodes.length > 0) {
            // Extract the raw markdown text for the collected nodes
            const firstNode = currentChunkNodes[0];
            const lastNode = currentChunkNodes[currentChunkNodes.length - 1];
            // Ensure positions exist before accessing offsets
             const start = firstNode.position?.start?.offset ?? startOffsetOfCurrentChunk;
             const end = lastNode.position?.end?.offset ?? start; // Use start if end is missing for some reason

             let content = markdownContent.substring(start, end).trim();

             // Basic cleanup - replace multiple newlines/spaces caused by node concatenation
             content = content.replace(/\n{3,}/g, '\n\n').replace(/ {2,}/g, ' ');


            if (content) { // Only add non-empty chunks
                const contentType = determineContentType(currentHeadings);
                const metadata: Chunk['metadata'] = {
                    source_heading: currentHeadings.length > 0 ? currentHeadings[currentHeadings.length - 1] : null,
                    headings: [...currentHeadings], // Copy the array
                    content_type: contentType,
                };

                // Extract Card ID specifically for card chunks
                if (contentType === 'card' && metadata.source_heading) {
                    const idMatch = metadata.source_heading.match(/\(ID: ([A-Z0-9-]+)\)/);
                    if (idMatch) {
                        metadata.card_id = idMatch[1];
                        // Optionally remove ID from heading in metadata for cleaner display?
                        // metadata.source_heading = metadata.source_heading.replace(/\(ID:.*\)/, '').trim();
                    }
                     // Include the card name (heading) in the content itself for embedding context
                     content = `${metadata.source_heading}\n${content}`;

                } else if (metadata.source_heading) {
                     // Include the heading in the content for rules/other sections
                     content = `${metadata.source_heading}\n${content}`;
                }


                chunks.push({ content, metadata });
            }
        }
        currentChunkNodes = []; // Reset nodes for the next chunk
        startOffsetOfCurrentChunk = 0; // Reset offset tracker
    }

    visit(tree, (node: Node) => {
        // Type guard to ensure position exists
        if (!('position' in node) || !node.position?.start?.offset) {
            return; // Skip nodes without position
        }

        if (node.type === 'heading') {
            const heading = node as Heading;
            const headingLevel = heading.depth;
            const headingText = toString(heading).trim();

            // Chunk primarily by H2 and H3. H1 defines major sections but content falls under H2/H3.
            if (headingLevel === 2 || headingLevel === 3) {
                // Finalize the previous chunk before starting a new one based on H2/H3
                finalizeChunk();

                // Update heading hierarchy based on the current heading's level
                currentHeadings = currentHeadings.slice(0, headingLevel - 1);
                currentHeadings.push(headingText);

                // Start collecting nodes for the new chunk, starting with the heading itself
                startOffsetOfCurrentChunk = node.position.start.offset; // Track start for substring fallback
                currentChunkNodes.push(node as Content); // Add heading node to the *new* chunk

            } else if (headingLevel === 1) {
                 // Finalize previous chunk if any content was collected under it
                 finalizeChunk();
                 // Reset hierarchy for top-level sections
                 currentHeadings = [headingText];
                 // H1 content itself is usually not substantial, content follows under H2/H3
                 // We don't start collecting nodes yet, wait for an H2/H3 or content nodes
                 startOffsetOfCurrentChunk = node.position.end.offset ?? 0; // Set potential start for next nodes

            } else {
                 // For H4+ or other nodes following a heading, add them to the current chunk nodes
                 if(currentChunkNodes.length > 0 || currentHeadings.length > 0) { // Only add if we're 'inside' a section
                     if (currentChunkNodes.length === 0) {
                         startOffsetOfCurrentChunk = node.position.start.offset; // Set start offset if this is the first node
                     }
                     currentChunkNodes.push(node as Content); // Assert as Content for adding to array
                 }
            }
        } else if (node.type !== 'thematicBreak' && node.type !== 'yaml') { // Collect non-heading content nodes
             // Add content nodes only if we are currently tracking a section (have headings)
             if (currentHeadings.length > 0) {
                 if (currentChunkNodes.length === 0) {
                    startOffsetOfCurrentChunk = node.position.start.offset; // Set start offset
                 }
                 currentChunkNodes.push(node as Content); // Assert as Content for adding to array
             }
        }
    });

    // Finalize any remaining collected nodes after the last heading
    finalizeChunk();

    // --- Optional Refinement ---
    // Example: Filter out very small chunks (adjust threshold as needed)
    const MIN_CHUNK_CHAR_LENGTH = 30; // Characters, not words
    const refinedChunks = chunks.filter(chunk => chunk.content.length >= MIN_CHUNK_CHAR_LENGTH);

    console.log(`Processed markdown. Initial chunks: ${chunks.length}, Refined chunks (>=${MIN_CHUNK_CHAR_LENGTH} chars): ${refinedChunks.length}.`);
    return refinedChunks;
}

/*
// Example Usage (requires running in a Node.js environment)
async function runExample() {
    const fs = await import('fs/promises'); // Dynamic import for Node.js fs
    const path = await import('path'); // Dynamic import for Node.js path

    try {
        // Adjust the path relative to where you run the script
        const markdownFilePath = path.resolve(__dirname, '../../src/data/games/arcs/arcs_unified.md');
        console.log(`Attempting to read: ${markdownFilePath}`);
        const markdown = await fs.readFile(markdownFilePath, 'utf-8');
        const chunks = processMarkdownAndChunk(markdown);

        console.log('\\n--- First 3 Chunks ---');
        chunks.slice(0, 3).forEach((chunk, i) => {
            console.log(`\\n--- Chunk ${i + 1} ---`);
            console.log('Metadata:', chunk.metadata);
            console.log('Content Preview:', chunk.content.substring(0, 150) + '...');
        });

        console.log('\\n--- Example Card Chunk ---');
        const cardChunk = chunks.find(c => c.metadata.content_type === 'card');
        if(cardChunk) {
            console.log('Metadata:', cardChunk.metadata);
            console.log('Content:', cardChunk.content);
        } else {
            console.log('No card chunk found in example output.');
        }

    } catch (error) {
        console.error('Error running example:', error);
    }
}

// To run the example:
// 1. Ensure you have ts-node installed (npm install -D ts-node @types/node)
// 2. Run the script using: ts-node path/to/markdownProcessor.ts
// runExample(); // Uncomment to run example when executing file directly
*/ 