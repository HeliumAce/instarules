# PRD: MCP-Enhanced Arcs Data Ingestion System

## Introduction/Overview

Transform the Arcs game rules data ingestion process from a manual, script-based workflow to an AI-assisted, MCP (Model Context Protocol) powered system. This enhancement will enable granular source attribution in the frontend, support incremental updates, and provide a modern, maintainable ingestion workflow.

**Problem:** The current ingestion system relies on a missing unified markdown file, uses manual shell scripts, and provides limited source attribution to users.

**Goal:** Create an intelligent, incremental ingestion system with enhanced source attribution that can be controlled through natural language commands.

## Goals

1. **Modernize Ingestion Workflow:** Replace manual scripts with MCP-assisted AI commands
2. **Enhanced Source Attribution:** Provide granular source references in the frontend Sources tooltip
3. **Optimize Embedding Architecture:** Migrate from OpenAI text-embedding-3-small to Supabase native gte-small embeddings for 10x cost reduction, architectural simplification, and 4x faster processing
4. **Incremental Processing:** Enable file-level updates without full re-ingestion
5. **Improved Maintainability:** Clean codebase with single source of truth for processing logic
6. **Better Performance:** Faster ingestion for content updates and additions

## User Stories

**As a content manager, I want to:**
- Add new FAQ content and re-ingest only that file so that I can quickly update the knowledge base
- Use natural language commands like "re-ingest the base game rules" so that I don't need to remember script commands
- See detailed source attribution in the frontend so that users know exactly where information comes from

**As a developer, I want to:**
- Have a clean, modern ingestion system so that the codebase is maintainable
- Use MCP for database operations so that I can leverage AI assistance for complex tasks
- Have automated validation so that I catch content issues before ingestion

**As an end user, I want to:**
- See specific source references (e.g., "Base Game Rules", "Card FAQ") so that I can verify information accuracy
- Have access to the most up-to-date content so that my game questions are answered correctly

## Functional Requirements

### Core Ingestion Requirements
1. **MCP Integration:** The system must integrate Supabase MCP server for AI-assisted database operations
2. **Granular File Processing:** The system must process individual markdown files (9 Arcs files) independently
3. **Enhanced Metadata:** The system must capture source_file, h1_heading, file_hash, and last_modified for each chunk
4. **Incremental Updates:** The system must support re-ingesting specific files without affecting others
5. **Content Validation:** The system must validate that each markdown file has exactly one H1 heading

### Database Requirements
6. **New Table Schema:** The system must create `arcs_rules_embeddings_v2` with enhanced metadata structure
7. **Backward Compatibility:** The system must maintain the same search interface for frontend consumption
8. **Safe Migration:** The system must allow validation of new table before replacing the old one
9. **Clean Cutover:** The system must support renaming `arcs_rules_embeddings_v2` to `arcs_rules_embeddings` after validation

### Processing Requirements
10. **Content-Type Chunking:** The system must apply different chunking strategies based on content type (rules, cards, FAQ)
11. **Source Attribution:** The system must include H1 heading and filename in chunk metadata
12. **Embedding Generation:** The system must generate embeddings using Supabase native gte-small model (384 dimensions) replacing OpenAI text-embedding-3-small (1536 dimensions)
13. **Embedding Architecture:** The system must use Supabase built-in AI inference (`Supabase.ai.Session`) eliminating external API dependencies
14. **File Change Detection:** The system must detect which files have been modified since last ingestion

### Error Handling Requirements
15. **MCP Connection Failure:** The system must provide clear error messages and manual retry options when MCP connection fails
16. **Malformed Content:** The system must skip problematic files with detailed warnings and continue processing others
17. **Embedding Service Resilience:** The system must handle Supabase AI inference failures gracefully with retry mechanisms
18. **Validation Checks:** The system must require confirmation before executing destructive database operations

### Documentation Requirements
19. **MCP Setup Guide:** The system must include documentation for configuring Supabase MCP server
20. **Usage Examples:** The system must provide example natural language commands for common ingestion tasks
21. **Embedding Migration Guide:** The system must document the transition from OpenAI to Supabase native embeddings
22. **Migration Guide:** The system must document the complete transition process from old to new system

## Non-Goals (Out of Scope)

- **Frontend search interface changes:** Only metadata enhancement for Sources tooltip
- **Other game systems:** Focus exclusively on Arcs content for this iteration
- **Real-time ingestion:** Manual/on-demand ingestion is sufficient
- **Complex content management UI:** Command-line/AI assistant interface is adequate
- **Multi-user ingestion:** Single-user workflow is acceptable
- **Legacy data migration:** Old embeddings will be replaced, not migrated

## Design Considerations

### Frontend Integration
- **Sources Tooltip Enhancement:** Display H1 headings as section headers (e.g., "Base Game Rules", "Card FAQ")
- **Metadata Consumption:** Frontend should read new `h1_heading` field from enhanced metadata
- **Backward Compatibility:** Ensure frontend works during transition period

### File Organization
- **H1 Standardization:** Each markdown file must have exactly one H1 heading at the beginning
- **Consistent Naming:** H1 headings should match the file's content scope (e.g., "Base Game Rules" for base game rules)

## Technical Considerations

### Dependencies
- **Supabase MCP Server:** `@supabase/mcp-server-supabase@latest`
- **Supabase AI Inference:** Built-in gte-small model (replacing OpenAI API)
- **Personal Access Token:** Required for MCP authentication

### Database Schema
```sql
CREATE TABLE arcs_rules_embeddings_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  metadata JSONB NOT NULL,
  source_file TEXT NOT NULL,
  h1_heading TEXT NOT NULL,
  embedding VECTOR(384),  -- Changed from 1536 (OpenAI) to 384 (Supabase gte-small)
  file_hash TEXT NOT NULL,
  last_modified TIMESTAMP NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### Processing Architecture
- **Single Processor:** Consolidate to `markdownProcessor.ts` (remove "Precise" suffix)
- **Embedding Strategy:** Use Supabase native `Supabase.ai.Session('gte-small')` for 384-dimensional vectors
- **Content-Type Strategy:** Different chunking parameters for rules (200 chars), cards (150 chars), FAQ (250 chars)
- **Change Detection:** Use file hashes and modification timestamps

### Embedding Model Transition Analysis
- **Performance Tradeoff:** 384-dimensional vectors vs 1536-dimensional (4x smaller)
- **Quality Impact:** Minimal degradation (61.36% vs 62.3% MTEB score = 0.94% difference)  
- **Speed Improvement:** 4x faster similarity calculations and storage operations
- **Cost Savings:** 10x reduction in embedding generation costs
- **Architectural Benefits:** Elimination of external API dependencies and key management

### Security Considerations
- **MCP Token Management:** Secure storage of personal access tokens
- **Reduced Attack Surface:** Elimination of OpenAI API keys and external dependencies
- **Database Branching:** Use development branches for testing ingestion changes
- **Validation Requirements:** Confirm destructive operations before execution

## Success Metrics

### Primary Metrics
1. **Source Attribution Quality:** 100% of search results include specific H1 heading in Sources tooltip
2. **Ingestion Performance:** Incremental updates complete in <30 seconds vs. full re-ingestion
3. **Search Quality:** Maintain search result relevance (expecting ~1% difference: 61.36% vs 62.3% MTEB)
4. **Processing Speed:** 4x faster similarity calculations with 384-dimensional vectors
5. **Cost Reduction:** 10x reduction in embedding generation costs

### Secondary Metrics
4. **Developer Experience:** Natural language commands work for common ingestion tasks
5. **Content Freshness:** New FAQ content appears in search results within minutes of ingestion
6. **System Reliability:** Zero data loss during incremental updates

### Validation Criteria
7. **Search Parity:** New system returns equivalent results for benchmark queries
8. **Metadata Accuracy:** All chunks include correct source_file and h1_heading values
9. **Incremental Integrity:** Partial updates don't corrupt existing embeddings

## Implementation Phases

### Phase 1: Foundation (Days 1-2)
- Configure Supabase MCP server
- Standardize H1 headings in markdown files
- Create enhanced database schema with VECTOR(384)
- Validate MCP connectivity

### Phase 2: Embedding Architecture Update (Days 2-3)
- Replace OpenAI embedding calls with Supabase AI inference
- Update Edge Functions to use `Supabase.ai.Session('gte-small')`
- Remove OpenAI API key dependencies
- Test embedding generation with new model

### Phase 3: Enhanced Processing (Days 3-4)
- Develop content validation script
- Enhance markdown processor with source attribution
- Implement incremental ingestion logic
- Test file-level change detection

### Phase 4: Integration & Testing (Days 5-6)
- Full ingestion with new system and embedding model
- Validate search quality and source attribution
- Test incremental update workflows
- Frontend integration for enhanced Sources

### Phase 5: Cutover & Cleanup (Day 7)
- Rename tables for production use
- Remove legacy ingestion scripts and OpenAI dependencies
- Update documentation
- Consolidate to single markdownProcessor.ts

## Open Questions

1. **Content Validation Timing:** Should H1 validation run automatically before each ingestion, or as a separate command?
2. **Error Recovery:** For partial ingestion failures, should the system auto-retry individual files or require manual intervention?
3. **Development Workflow:** Should there be a "dry-run" mode that shows what would be ingested without actually processing?
4. **Monitoring:** What logging/monitoring should be included for production ingestion operations?

## Files to Modify/Create

### New Files
- `tasks/prd-mcp-enhanced-ingestion.md` (this document)
- `.cursor/mcp.json` (MCP configuration)
- Documentation for MCP setup and usage

### Modified Files
- `backend/utils/markdownProcessorPrecise.ts` → `backend/utils/markdownProcessor.ts`
- `supabase/functions/generate-embeddings/index.ts` (replace OpenAI with Supabase AI inference)
- Frontend Sources tooltip component (consume new metadata)
- Database migrations for new table schema with VECTOR(384)

### Removed Files
- `backend/scripts/ingestArcsRules.ts`
- `backend/scripts/run-ingest.sh`
- `backend/scripts/apply-migration.js`
- `backend/utils/markdownProcessor.ts` (old version)

## Acceptance Criteria

The feature is complete when:
1. ✅ MCP commands can trigger incremental ingestion of specific files
2. ✅ Frontend Sources tooltip displays granular H1-based sections
3. ✅ Search quality meets or exceeds current system performance
4. ✅ All legacy ingestion scripts have been removed
5. ✅ Documentation enables team members to use MCP ingestion
6. ✅ Validation prevents ingestion of malformed content
7. ✅ System handles errors gracefully without data corruption 