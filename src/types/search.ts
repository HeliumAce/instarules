/**
 * Centralized search result types used across the application
 * Consolidates duplicate interfaces from useGameRules.ts, RulesService.ts, and vector-search edge function
 */

export interface VectorSearchResult {
  id: string;
  content: string;
  metadata: Record<string, any>;
  source_file: string;
  h1_heading: string;
  similarity: number;
} 