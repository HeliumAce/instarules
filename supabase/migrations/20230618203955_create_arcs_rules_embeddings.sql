-- Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create a table for storing ARCS game rules with embeddings
CREATE TABLE arcs_rules_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  metadata JSONB NOT NULL,
  embedding VECTOR(1536), -- OpenAI text-embedding-3-small dimensions (1536, not 384)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create a function to match embeddings using cosine similarity
CREATE OR REPLACE FUNCTION match_arcs_rules(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.75,
  match_count INT DEFAULT 5
) RETURNS TABLE (
  id UUID,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
) LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    arcs_rules_embeddings.id,
    arcs_rules_embeddings.content,
    arcs_rules_embeddings.metadata,
    1 - (arcs_rules_embeddings.embedding <=> query_embedding) AS similarity
  FROM arcs_rules_embeddings
  WHERE 1 - (arcs_rules_embeddings.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$; 