# Tasks: MCP-Enhanced Arcs Data Ingestion System

Based on PRD: `prd-mcp-enhanced-ingestion.md`

## Relevant Files

- `backend/utils/markdownProcessorPrecise.ts` → `backend/utils/markdownProcessor.ts` - Main markdown processing logic to be consolidated and enhanced with source attribution
- `supabase/functions/generate-embeddings/index.ts` - Edge Function for embedding generation (already using Supabase gte-small)
- `supabase/functions/git avector-search/index.ts` - Edge Function for query embeddings, needs update from OpenAI to Supabase AI inference
- `supabase/migrations/20250629135110_create_arcs_rules_embeddings_v2.sql` - New database migration for enhanced table schema with VECTOR(384) (created and applied)
- `.cursor/mcp.json` - MCP configuration file for Supabase server integration (created with template, needs project-ref and access token)
- `src/data/games/arcs/*.md` - Arcs markdown files with standardized H1 headings (9 files updated: 3 fixed multiple H1s, 6 already correct)
- `src/components/ui/*.tsx` - Frontend Sources tooltip component for consuming enhanced metadata
- `tasks/h1-validation-script.js` - Content validation script for H1 heading checks
- `tasks/mcp-setup-guide.md` - Documentation for MCP server configuration
- `tasks/embedding-migration-guide.md` - Documentation for OpenAI to Supabase embedding transition

### Notes

- The migration involves both database schema changes and embedding model transitions
- MCP integration requires proper authentication setup with personal access tokens
- All markdown files must have exactly one H1 heading before ingestion
- The new system eliminates external OpenAI API dependencies in favor of Supabase native inference

## Tasks

- [ ] 1.0 Configure MCP Foundation and Database Schema
  - [x] 1.1 Install and configure Supabase MCP server (`@supabase/mcp-server-supabase@latest`)
  - [x] 1.2 Create `.cursor/mcp.json` configuration file with Supabase server settings
  - [x] 1.3 Set up personal access token for MCP authentication
  - [x] 1.4 Create database migration `supabase/migrations/[timestamp]_create_arcs_rules_embeddings_v2.sql` with VECTOR(384) schema
  - [x] 1.5 Test MCP connectivity with basic database queries
  - [x] 1.6 Standardize H1 headings in all Arcs markdown files (ensure exactly one H1 per file)
  - [ ] 1.7 Create content validation script `tasks/h1-validation-script.js` to check H1 compliance (DEFERRED - manual validation completed)

- [ ] 2.0 Migrate Embedding Architecture from OpenAI to Supabase Native
  - [x] 2.1 Update `supabase/functions/generate-embeddings/index.ts` to use Supabase gte-small (already complete)
  - [x] 2.2 Update `supabase/functions/vector-search/index.ts` to use Supabase AI inference instead of OpenAI
  - [x] 2.3 Remove OpenAI API client and dependencies from vector-search Edge Function  
  - [x] 2.4 Update vector-search logic to handle 384-dimensional vectors and arcs_rules_embeddings_v2 table
  - [x] 2.5 Remove OpenAI API key from environment variables and secrets
  - [x] 2.6 Test end-to-end search functionality with new 384-dimensional embeddings
  - [ ] 2.7 Validate search quality and similarity functionality matches/exceeds current performance (DEFERRED - requires populated v2 table, moved to Phase 4)

- [x] 3.0 Enhance Content Processing and Source Attribution
  - [x] 3.1 Rename `backend/utils/markdownProcessorPrecise.ts` to `backend/utils/markdownProcessor.ts`
  - [x] 3.2 Remove old `backend/utils/markdownProcessor.ts` file
  - [x] 3.3 Enhance processor to capture `source_file`, `h1_heading`, `file_hash`, and `last_modified` metadata
  - [x] 3.4 Implement content-type specific chunking strategies (rules: 200 chars, cards: 150 chars, FAQ: 250 chars)
  - [x] 3.5 Add file hash calculation for change detection (completed in 3.3 - SHA-256 hash of file content)
  - [x] 3.6 Update processor to generate enhanced JSONB metadata structure (separated fileMetadata from JSONB metadata for v2 schema optimization)
  - [x] 3.7 Update ingestion script `backend/scripts/ingestArcsRules.ts` to use enhanced processor and v2 database schema

- [ ] 4.0 Implement Incremental Ingestion and Testing
  - [ ] 4.1 Implement file change detection logic using file hashes and modification timestamps
  - [ ] 4.2 Create MCP commands for selective file ingestion (e.g., "re-ingest base game rules")
  - [ ] 4.3 Add validation to prevent ingestion of files with malformed H1 headings
  - [ ] 4.4 Test incremental ingestion workflow with sample file updates
  - [ ] 4.5 Update frontend Sources tooltip component to consume `h1_heading` from enhanced metadata
  - [ ] 4.6 Test end-to-end workflow: content update → ingestion → frontend display
  - [ ] 4.7 Validate search quality and similarity functionality matches/exceeds current performance (moved from 2.7)
  - [ ] 4.8 Create comprehensive test suite for search quality validation

- [ ] 5.0 Execute Production Cutover and System Cleanup
  - [ ] 5.1 Deploy updated Edge Function with Supabase AI inference to production
  - [ ] 5.2 Run full ingestion with new system to populate `arcs_rules_embeddings_v2` table
  - [ ] 5.3 Validate search quality and source attribution in production environment
  - [ ] 5.4 Execute table rename: `arcs_rules_embeddings_v2` → `arcs_rules_embeddings`
  - [ ] 5.5 Update RPC function `match_arcs_rules` to handle new VECTOR(384) dimensions
  - [ ] 5.6 Remove legacy files: `backend/scripts/ingestArcsRules.ts`, `run-ingest.sh`, `apply-migration.js`
  - [ ] 5.7 Create documentation: `tasks/mcp-setup-guide.md` and `tasks/embedding-migration-guide.md`
  - [ ] 5.8 Update project README with new MCP ingestion workflow instructions 