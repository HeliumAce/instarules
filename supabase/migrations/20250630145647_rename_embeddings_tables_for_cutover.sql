-- Safe table rename for production cutover
-- This migration implements the safe approach:
-- 1. Rename old table to backup (preserves data)  
-- 2. Rename new v2 table to production name
-- 
-- BEFORE: arcs_rules_embeddings (old), arcs_rules_embeddings_v2 (new)
-- AFTER:  arcs_rules_embeddings_backup (old), arcs_rules_embeddings (new)

-- Step 1: Rename old table to backup
ALTER TABLE arcs_rules_embeddings RENAME TO arcs_rules_embeddings_backup;

-- Step 2: Rename new table to production name  
ALTER TABLE arcs_rules_embeddings_v2 RENAME TO arcs_rules_embeddings;

-- Note: The new arcs_rules_embeddings table now has:
-- - 384-dimensional embeddings (vs 1536 in backup)
-- - Enhanced metadata (source_file, h1_heading, file_hash, last_modified)
-- - Better performance and cost efficiency
