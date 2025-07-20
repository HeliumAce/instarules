-- Update the match_arcs_rules_v2 function to use the renamed table
-- After table rename: arcs_rules_embeddings_v2 → arcs_rules_embeddings

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
    arcs_rules_embeddings.id,
    arcs_rules_embeddings.content,
    arcs_rules_embeddings.metadata,
    arcs_rules_embeddings.source_file,
    arcs_rules_embeddings.h1_heading,
    1 - (arcs_rules_embeddings.embedding <=> query_embedding) AS similarity
  FROM arcs_rules_embeddings
  WHERE 1 - (arcs_rules_embeddings.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$; 