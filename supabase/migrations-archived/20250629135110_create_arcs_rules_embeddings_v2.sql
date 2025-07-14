-- Enhanced ARCS rules embeddings table with source attribution and Supabase native embeddings
-- Migration from OpenAI text-embedding-3-small (1536 dims) to Supabase gte-small (384 dims)

-- Ensure pgvector extension is available
CREATE EXTENSION IF NOT EXISTS vector;

-- Create enhanced table for storing ARCS game rules with source attribution
CREATE TABLE arcs_rules_embeddings_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  metadata JSONB NOT NULL,
  source_file TEXT NOT NULL,
  h1_heading TEXT NOT NULL,
  embedding VECTOR(384), -- Supabase gte-small dimensions (384 vs OpenAI's 1536)
  file_hash TEXT NOT NULL,
  last_modified TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for enhanced querying performance
CREATE INDEX idx_arcs_rules_embeddings_v2_source_file ON arcs_rules_embeddings_v2(source_file);
CREATE INDEX idx_arcs_rules_embeddings_v2_h1_heading ON arcs_rules_embeddings_v2(h1_heading);
CREATE INDEX idx_arcs_rules_embeddings_v2_file_hash ON arcs_rules_embeddings_v2(file_hash);
CREATE INDEX idx_arcs_rules_embeddings_v2_last_modified ON arcs_rules_embeddings_v2(last_modified);

-- Create embedding index for cosine similarity searches (384 dimensions)
CREATE INDEX idx_arcs_rules_embeddings_v2_embedding ON arcs_rules_embeddings_v2 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Create enhanced function to match embeddings using cosine similarity (384 dimensions)
CREATE OR REPLACE FUNCTION match_arcs_rules_v2(
  query_embedding VECTOR(384),
  match_threshold FLOAT DEFAULT 0.75,
  match_count INT DEFAULT 5
) RETURNS TABLE (
  id UUID,
  content TEXT,
  metadata JSONB,
  source_file TEXT,
  h1_heading TEXT,
  similarity FLOAT
) LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    arcs_rules_embeddings_v2.id,
    arcs_rules_embeddings_v2.content,
    arcs_rules_embeddings_v2.metadata,
    arcs_rules_embeddings_v2.source_file,
    arcs_rules_embeddings_v2.h1_heading,
    1 - (arcs_rules_embeddings_v2.embedding <=> query_embedding) AS similarity
  FROM arcs_rules_embeddings_v2
  WHERE 1 - (arcs_rules_embeddings_v2.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

-- Enable Row Level Security
ALTER TABLE arcs_rules_embeddings_v2 ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access (same as original table)
CREATE POLICY "Allow public read access" ON arcs_rules_embeddings_v2
FOR SELECT USING (true);

-- Create policy to allow authenticated users to insert/update
CREATE POLICY "Allow authenticated insert/update" ON arcs_rules_embeddings_v2
FOR ALL USING (auth.role() = 'authenticated'); 