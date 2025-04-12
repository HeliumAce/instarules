
## Current Implementation Overview

Your system uses a RAG (Retrieval-Augmented Generation) approach:
1. Game rules are chunked and embedded using OpenAI's text-embedding-3-small model
2. User queries are embedded using the same model
3. Vector similarity search retrieves relevant rule sections from Supabase
4. These sections are fed into an LLM (Claude) with a prompt template
5. Claude generates responses based on the retrieved context

## Identified Issues

### 1. Similarity Threshold and Match Count
- Current threshold is 0.75 in backend but 0.70 in the Edge Function
- Only retrieving 5 matches maximum
- When no matches exceed the threshold, you get empty results

### 2. Content Chunking
- Current chunking strategy breaks content into small pieces (150-200 chars)
- This can fragment context needed for complex questions

### 3. Prompt Engineering
- The prompt doesn't provide clear guidance for handling no relevant context
- No specific approach for handling questions outside the rule scope

### 4. Metadata Utilization
- Rich metadata exists but isn't fully leveraged in relevance scoring

## Recommended Improvements [MODERATE]

### 1. Adjust Similarity Settings
- **Lower the match threshold**: Try 0.65-0.70 universally to increase recall
- **Increase match count**: Retrieve 8-10 results instead of 5
- **Add minimum matches**: When fewer than 3 matches are found, lower the threshold dynamically

### 2. Chunking Strategy Refinement [MODERATE]
- **Revise chunking approach**: Create both small chunks (current approach) and larger, overlapping chunks to capture more context
- **Implement hierarchical chunking**: Store parent-child relationships between chunks

### 3. Prompt Engineering Improvements [MINOR]
- **Add fallback instruction**: Explicitly guide the LLM on how to respond when context is insufficient
- **Improve "no answer" response**: Create a more helpful "I don't have enough information" response
- **Add reasoning steps**: Have the LLM assess relevance of each chunk before answering

### 4. Search Query Preprocessing [MINOR]
- **Implement query rewriting**: Expand abbreviated terms and game-specific jargon
- **Add query classification**: Identify question type to adjust search parameters

### 5. Result Ranking Enhancement [MODERATE]
- **Weighted metadata matching**: Boost relevance when metadata fields match query terms
- **Semantic diversity**: Ensure retrieved chunks cover different aspects of the question

### 6. Monitoring and Optimization [MAJOR]
- **Add result tracking**: Log queries, retrieved chunks, and user feedback
- **Implement A/B testing**: Compare different thresholds and prompt strategies

## Implementation Plan

1. **First Priority**: Adjust similarity threshold and match count parameters
   - This is the quickest win - modify `matchThreshold` in the vector search function to 0.65-0.70
   - Increase `matchCount` to 8-10
   - DONE

2. **Second Priority**: Improve the prompt
   - Add explicit instructions for handling "no good matches" cases
   - Implement a reasoning step where the LLM first evaluates chunk relevance

3. **Third Priority**: Enhance chunking strategy
   - Revisit your chunking logic to create better-sized chunks with more context

4. **Fourth Priority**: Implement search query preprocessing
   - Add a step that expands game terms and rephrases questions before vector search

Would you like me to provide more detailed implementation guidance for any of these specific areas?
