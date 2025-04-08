-- Add IVFFlat index for cosine similarity search on embeddings
CREATE INDEX CONCURRENTLY IF NOT EXISTS arcs_rules_embeddings_embedding_ivfflat_idx
ON arcs_rules_embeddings 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100); 