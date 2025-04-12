# Project Overview

This document outlines the technical stack, project structure, and core functionality of the Instarules application.

## Tech Stack

**Frontend:**
*   **Framework:** React (`react`, `react-dom`)
*   **Build Tool:** Vite (`vite`, `@vitejs/plugin-react-swc`)
*   **Language:** TypeScript (`typescript`)
*   **Routing:** React Router (`react-router-dom`)
*   **UI Components:** shadcn/ui (various `@radix-ui/*` packages, `tailwind-merge`, `tailwindcss-animate`, `class-variance-authority`, `clsx`, `lucide-react`)
*   **State Management/Data Fetching:** TanStack Query (`@tanstack/react-query`)
*   **Forms:** React Hook Form (`react-hook-form`) with Zod (`zod`) for validation (`@hookform/resolvers`)
*   **Styling:** Tailwind CSS (`tailwindcss`, `postcss`, `autoprefixer`)
*   **Notifications:** Sonner (`sonner`), Toaster (`@radix-ui/react-toast`)
*   **Theming:** `next-themes`
*   **Charts:** Recharts (`recharts`)
*   **Markdown:** `react-markdown`
*   **Other UI:** `react-resizable-panels`, `cmdk`, `embla-carousel-react`, `input-otp`, `vaul`

**Backend/Services:**
*   **Database/Auth:** Supabase (`@supabase/supabase-js`) - Used via context providers (`SupabaseProvider`, `AuthProvider`).
*   **AI Completions (Frontend):** OpenRouter (`axios` to `https://openrouter.ai`) via `LLMService.ts`. Uses `VITE_OPENROUTER_API_KEY`.
*   **AI Models (via OpenRouter):** Configured to use `anthropic/claude-3-sonnet:beta` as default in `LLMService.ts`.
*   **AI Embeddings (Backend):** OpenAI (`openai`, `text-embedding-3-small`) - Used in `backend/scripts/ingestArcsRules.ts` for generating text embeddings.
*   **HTTP Client (Frontend):** Axios (`axios`) - Used in `LLMService.ts`.

**Development:**
*   **Linting:** ESLint (`

## Core Functionality

Based on the file structure and dependencies:

1.  **Authentication:** Uses Supabase for user authentication (`AuthProvider`, `Auth` page).
2.  **Dashboard:** A central dashboard page (`Dashboard` page).
3.  **Game Chat:** A feature likely involving interaction within a specific game context (`GameChat` page, `GameProvider`). Uses **OpenRouter** via `LLMService.ts` for AI-driven chat/rule explanations based on processed rule data.
4.  **Data Management:** Uses Supabase as a backend (`SupabaseProvider`) and TanStack Query for managing server state on the client.
5.  **Vector Search (Backend):** Backend includes functionality (`searchService.ts`, `ingestArcsRules.ts`) to generate **OpenAI embeddings** for rule chunks and perform vector similarity searches using Supabase PostgreSQL functions (`match_arcs_rules`).
6.  **UI:** Leverages shadcn/ui for building the user interface with Tailwind CSS for styling.
7.  **Backend Scripts:** Includes scripts for tasks like data ingestion/embedding generation (`ingest` script) and database migrations (`migrate` script).

Let's implement the simpler plan by adding the query preprocessor service and integrating it directly in the useGameRules hook. I'll create the implementation in steps:

## Step 1: Create the QueryPreprocessorService.ts file

```typescript:src/services/QueryPreprocessorService.ts
/**
 * Query Preprocessor Service
 * 
 * Enhances search queries to improve vector search results by expanding terms
 * and adding relevant context based on query classification.
 */

// Query types for classification
type QueryType = 
  | 'RESOURCE_QUESTION'
  | 'CARD_QUESTION'
  | 'RULE_QUESTION'
  | 'SETUP_QUESTION'
  | 'VICTORY_QUESTION'
  | 'ACTION_QUESTION'
  | 'GAMEPLAY_QUESTION'
  | 'COMPONENT_QUESTION'
  | 'GENERAL_QUESTION';

/**
 * Classifies a query into different types to determine preprocessing strategy
 */
function classifyQuery(query: string): QueryType[] {
  const lowerQuery = query.toLowerCase();
  const classifications: QueryType[] = [];
  
  // Resource questions
  if (
    lowerQuery.includes('resource') || 
    lowerQuery.includes('spend') || 
    lowerQuery.includes('token') ||
    (lowerQuery.includes('what') && lowerQuery.includes('5') && lowerQuery.includes('type'))
  ) {
    classifications.push('RESOURCE_QUESTION');
  }
  
  // Card questions
  if (
    lowerQuery.includes('card') || 
    lowerQuery.includes('deck') || 
    lowerQuery.includes('hand')
  ) {
    classifications.push('CARD_QUESTION');
  }
  
  // Rule clarifications
  if (
    lowerQuery.includes('rule') || 
    lowerQuery.includes('how do i') || 
    lowerQuery.includes('how does') || 
    lowerQuery.includes('how to') ||
    lowerQuery.includes('can i') ||
    lowerQuery.includes('allowed')
  ) {
    classifications.push('RULE_QUESTION');
  }
  
  // Setup questions
  if (
    lowerQuery.includes('setup') || 
    lowerQuery.includes('start') || 
    lowerQuery.includes('begin')
  ) {
    classifications.push('SETUP_QUESTION');
  }
  
  // Victory conditions
  if (
    lowerQuery.includes('win') || 
    lowerQuery.includes('victor') || 
    lowerQuery.includes('scoring') ||
    lowerQuery.includes('points') ||
    lowerQuery.includes('objective')
  ) {
    classifications.push('VICTORY_QUESTION');
  }
  
  // Action questions
  if (
    lowerQuery.includes('action') || 
    lowerQuery.includes('move') || 
    lowerQuery.includes('turn') ||
    lowerQuery.includes('play')
  ) {
    classifications.push('ACTION_QUESTION');
  }
  
  // Component questions
  if (
    lowerQuery.includes('piece') || 
    lowerQuery.includes('component') || 
    lowerQuery.includes('token') ||
    lowerQuery.includes('marker') ||
    lowerQuery.includes('board') ||
    lowerQuery.includes('tile')
  ) {
    classifications.push('COMPONENT_QUESTION');
  }
  
  // Enumeration questions (what are the X...)
  if (
    (lowerQuery.includes('what') && 
     (lowerQuery.includes('are') || lowerQuery.includes('is')) && 
     (
       lowerQuery.includes('the 5') || 
       lowerQuery.includes('the five') || 
       lowerQuery.includes('different types') ||
       lowerQuery.includes('kinds of')
     )
    )
  ) {
    // Check if we've already classified this
    if (classifications.length === 0) {
      classifications.push('COMPONENT_QUESTION');
    }
  }
  
  // Catch-all
  if (classifications.length === 0) {
    classifications.push('GENERAL_QUESTION');
  }
  
  return classifications;
}

/**
 * Expand a query with additional terms based on query type
 */
function expandQueryByType(query: string, types: QueryType[]): string[] {
  const expansions: string[] = [query]; // Always include original query
  
  if (types.includes('RESOURCE_QUESTION')) {
    expansions.push(`${query} tokens spend prelude action material fuel weapon relic psionic list types`);
    expansions.push(`resource tokens spend actions list types`);
  }
  
  if (types.includes('CARD_QUESTION')) {
    expansions.push(`${query} play hand deck discard action effect text abilities`);
  }
  
  if (types.includes('VICTORY_QUESTION')) {
    expansions.push(`${query} win game victory points objective scoring end conditions`);
  }
  
  if (types.includes('ACTION_QUESTION')) {
    expansions.push(`${query} turn action move build repair fight battle secure abilities`);
  }
  
  if (types.includes('COMPONENT_QUESTION')) {
    // For component questions like "what are the 5 [something]"
    if (query.toLowerCase().match(/what are the (5|five|different)/)) {
      expansions.push(`${query} list items bullets types components tokens resources actions`);
      expansions.push(`components resources actions list types rulebook`);
    }
  }
  
  return expansions;
}

/**
 * Main preprocessing function that transforms a query for better search results
 */
export function preprocessQuery(query: string): string[] {
  // 1. Classify the query
  const queryTypes = classifyQuery(query);
  
  // 2. Expand based on classification
  const expandedQueries = expandQueryByType(query, queryTypes);
  
  // 3. Log for debugging
  console.log(`[QueryPreprocessor] Original: "${query}"`);
  console.log(`[QueryPreprocessor] Types: ${queryTypes.join(', ')}`);
  console.log(`[QueryPreprocessor] Expanded: ${expandedQueries.length} variations`);
  
  return expandedQueries;
}

// Helper functions for testing and special cases
export function isResourceQuestion(query: string): boolean {
  return classifyQuery(query).includes('RESOURCE_QUESTION');
}

export function isEnumerationQuestion(query: string): boolean {
  const lowerQuery = query.toLowerCase();
  return lowerQuery.match(/what are the (5|five|different|types|kinds)/) !== null;
}
```
## Step 2: Integrate the preprocessor into useGameRules.ts

```typescript:src/hooks/useGameRules.ts
import { useQuery, useMutation, UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import { getLLMCompletion } from '@/services/LLMService';
import { fetchGameRules, fetchRelevantSectionsFromVectorDb, findRelevantSections } from '@/services/RulesService';
import { preprocessQuery } from '@/services/QueryPreprocessorService';
import { gameResponses } from '@/data/games';
import { useSupabase } from '@/context/SupabaseContext';

// ... existing code ...

  // Mutation to ask question using hybrid search for context
  const askMutation = useMutation<string, Error, AskQuestionVariables>({
    mutationFn: async ({ question }: AskQuestionVariables) => {
      // Ensure game name is available (needed for prompt)
      const gameName = rulesQuery.data?.game;
      if (!gameName) {
        throw new Error('Game information not loaded yet.'); 
      }

      // Preprocess the query to get improved search terms
      const expandedQueries = preprocessQuery(question);
      console.log(`[Hybrid Search] Using ${expandedQueries.length} query variations`);
      
      // Step 1: Perform vector search with all query variations
      console.log(`[Hybrid Search] Starting vector searches`);
      let allVectorResults: VectorSearchResult[] = [];
      
      // Sequential search using all expanded queries
      for (const expandedQuery of expandedQueries) {
        console.log(`[Hybrid Search] Vector search for: "${expandedQuery}"`);
        const results = await fetchRelevantSectionsFromVectorDb(supabase, expandedQuery);
        console.log(`[Hybrid Search] Found ${results.length} results for variation`);
        
        // Add results to combined set
        allVectorResults = [...allVectorResults, ...results];
      }
      
      // Deduplicate vector results
      const vectorResults = allVectorResults.filter((result, index, self) => 
        index === self.findIndex((r) => r.id === result.id)
      );
      
      console.log(`[Hybrid Search] Total unique vector results: ${vectorResults.length}`);
      
      // For conceptual questions like "how to win", do a second search with broader terms
      if (vectorResults.length < 2) {
        const broadQuery = question.toLowerCase().includes("win") ? 
          "victory conditions win game objective" : question;
        
        if (broadQuery !== question) {
          console.log(`[Hybrid Search] Broadening vector search with: "${broadQuery}"`);
          const additionalSections = await fetchRelevantSectionsFromVectorDb(supabase, broadQuery);
          console.log(`[Hybrid Search] Broadened search returned ${additionalSections.length} results`);
          
          // Add additional results
          const combinedVectorResults = [...vectorResults, ...additionalSections];
          
          // Deduplicate again
          vectorResults.splice(0, vectorResults.length, ...combinedVectorResults.filter((result, index, self) => 
            index === self.findIndex((r) => r.id === result.id)
          ));
          
          console.log(`[Hybrid Search] Total unique vector results after broadening: ${vectorResults.length}`);
        }
      }
      
      // Step 2: Perform text search using existing functionality
      console.log(`[Hybrid Search] Performing text search for original and expanded queries`);
      // Get the rules data (using either from rulesQuery or fetch it if needed)
      const rulesData = rulesQuery.data?.rules || await fetchGameRules(gameId);
      
      // Try text search with both original and expanded queries
      let allTextResults: any[] = [];
      for (const expandedQuery of expandedQueries) {
        const results = findRelevantSections(rulesData, expandedQuery);
        allTextResults = [...allTextResults, ...results];
      }
      
      // Deduplicate text results by title
      const textResults = allTextResults.filter((result, index, self) => 
        index === self.findIndex((r) => r.title === result.title)
      );
      
      console.log(`[Hybrid Search] Text search returned ${textResults.length} unique results`);
      
      // Step 3: Convert text results to match vector result format
      const formattedTextResults: VectorSearchResult[] = textResults.map((item, index) => ({
        id: `text-${index}`,
        content: typeof item.content === 'string' ? item.content : JSON.stringify(item.content),
        metadata: {
          source_heading: item.title,
          headings: [item.title],
          content_type: item.sourceType?.toLowerCase() || 'other',
          source: 'text_search'
        },
        similarity: 0.7 - (index * 0.05) // Assign decreasing similarity scores
      }));
      
      // Step 4: Combine and deduplicate results
      const allResults = [...vectorResults];
      
      // Add text results, avoiding duplicates
      for (const textResult of formattedTextResults) {
        // Simple deduplication check based on content
        const isDuplicate = vectorResults.some(vr => {
          const vrPreview = vr.content.substring(0, 100).toLowerCase();
          const trPreview = textResult.content.substring(0, 100).toLowerCase();
          return vrPreview.includes(trPreview) || trPreview.includes(vrPreview);
        });
        
        if (!isDuplicate) {
          allResults.push(textResult);
        }
      }
      
      // Sort by similarity and take top results
      const finalResults = allResults
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 8);
      
      // Log combined results for debugging
      console.log(`[Hybrid Search] Final combined results: ${finalResults.length}`);
      finalResults.forEach((result, i) => {
        const source = result.id.toString().startsWith('text') ? 'text search' : 'vector search';
        console.log(`Result #${i+1}: similarity=${result.similarity.toFixed(2)}, source=${source}`);
        console.log(`Content preview: ${result.content.substring(0, 100).replace(/\n/g, ' ')}...`);
      });

      if (finalResults.length > 0) {
        // Use combined results to build prompt
        const prompt = buildPrompt(gameName, question, finalResults);
        const response = await getLLMCompletion({ prompt }); 
        return response;
      } else {
        // Fallback if no results found
        return getFallbackResponse(question); 
      }
    },
  });
```
## Step 3: Add the QueryPreprocessorService import to the required files

Let's check the top-level imports in the RulesService.ts file to ensure everything is properly connected:

Read file: src/services/RulesService.ts
Let's finish implementing the hybrid search integration by ensuring our types are correct. Let's check the VectorSearchResult type:

Ran tool
Now, let's first check if there's an existing QueryPreprocessorService:

Ran tool
Let's check the implementation of the QueryPreprocessorService:

Read file: src/services/QueryPreprocessorService.ts
Now let's examine the VectorSearchResult type in both files:

Read file: src/hooks/useGameRules.ts

Read file: src/services/RulesService.ts

Read file: src/services/RulesService.ts
Now let's check the QueryPreprocessorService:

Read file: src/services/QueryPreprocessorService.ts
Based on the code examination, here's an overview of the `VectorSearchResult` type and its usage:

## VectorSearchResult Analysis [COMPLETE]

The `VectorSearchResult` interface is defined in `src/services/RulesService.ts` (line ~314) as:

```typescript
interface VectorSearchResult {
  id: string;
  content: string;
  metadata: Record<string, any>;
  similarity: number;
}
```

### Key Model Points:

1. **Origin**: Results come from a vector database query through a Supabase edge function called `vector-search`.

2. **Implementation in `RulesService.ts`**:
   - The `fetchRelevantSectionsFromVectorDb` function (lines 323-380) makes an authenticated API call to the vector search edge function.
   - It returns an array of `VectorSearchResult` objects.

3. **Implementation in `useGameRules.ts`**:
   - The hook uses this type to handle vector search results for game rules.
   - It combines vector search with traditional text-based search using `findRelevantSections`.

4. **Metadata Usage**: The `metadata` field contains additional information about each result, which can include section titles, rule categories, and other contextual data used for filtering and presentation.

5. **Authentication**: The vector search requires authentication, and the service extracts a session token to authorize the request.

The implementation follows a hybrid search approach, combining:
1. Semantic vector search (using embeddings)
2. Traditional keyword-based search
3. Query preprocessing (from `QueryPreprocessorService.ts`) to improve search quality

This dual approach helps provide more relevant results by capturing both semantic similarity and exact keyword matching.
