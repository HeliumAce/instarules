## Relevant Files

- `src/types/search.ts` - Centralized interface for VectorSearchResult used across the application.
- `src/prompts/gameRulesPrompt.ts` - Extracted prompt building logic from useGameRules hook.
- `src/services/SourceFormatterService.ts` - Data transformation and source formatting utilities.
- `src/services/query-processing/queryClassifier.ts` - Query classification logic.
- `src/services/query-processing/queryExpander.ts` - Query expansion logic.
- `src/services/query-processing/followUpHandler.ts` - Follow-up detection and reformulation.
- `src/services/QueryPreprocessorService.ts` - Refactored to compose new query processing modules.
- `src/hooks/useGameRules.ts` - Simplified hook focusing on react-query orchestration.
- `backend/config/ingestionConfig.ts` - Centralized configuration for ingestion scripts.
- `backend/utils/fileUtils.ts` - File metadata extraction utilities.
- `backend/utils/chunkingRules.ts` - Content-type specific chunking rules.
- `backend/utils/markdownProcessor.ts` - Simplified to focus on core chunking logic.
- `backend/services/ingestionService.ts` - Refined to focus on command parsing and orchestration.
- `backend/scripts/ingestArcsRules.ts` - Primary ingestion workflow script.
- `project-docs/project-tech.md` - Updated with new architecture documentation.

### Development Guidelines

**📋 RECOMMENDED APPROACH: Incremental File-by-File Refactoring**

**Why Incremental:**
- Reduces cognitive load and risk of introducing bugs
- Provides faster feedback loops and confidence building
- Easier to isolate and fix issues when they occur
- Allows for testing and validation at each step

**Phase-Based Execution:**
- **Phase 1:** Complete `useGameRules.ts` refactor (tasks 1.1-1.4) → Test → Commit
- **Phase 2:** Backend configuration centralization (tasks 3.1-3.4) → Test → Commit  
- **Phase 3:** Query processing decomposition (tasks 2.1-2.5) → Test → Commit
- **Phase 4:** Markdown processor (tasks 4.1-4.5) if still beneficial

**Testing Strategy:**
- Test thoroughly after each phase before moving to the next
- Maintain existing interfaces during refactoring to avoid breaking changes
- Focus on functional verification over unit tests initially

**Migration Approach:**
- Use the "Strangler Fig" pattern - replace internals but keep public APIs unchanged
- External consumers of refactored modules should require zero changes
- Commit working code frequently to enable easy rollback

## Tasks

- [ ] 1.0 Refactor `useGameRules.ts`: Extract Prompt and Helper Logic
  - [ ] 1.1 Create `src/types/search.ts` with centralized `VectorSearchResult` interface
    - **What:** Consolidate 3 duplicate `VectorSearchResult` interfaces currently in `useGameRules.ts`, `RulesService.ts`, and `vector-search/index.ts`
    - **Why:** Eliminates code duplication and provides single source of truth for search result types
    - **Next steps:** Update imports in the 3 source files and remove their local definitions
  - [ ] 1.2 Create `src/prompts/gameRulesPrompt.ts` and extract `buildPrompt` function from `useGameRules.ts`
    - **What:** Move the 100+ line `buildPrompt` function (lines 61-256 in useGameRules.ts) to dedicated prompt module
    - **Dependencies to extract with the function:**
      - `calculateContextCompleteness` helper function (line 257)
      - `classifyQuery` import (from QueryPreprocessorService)
      - Any other helper functions called within buildPrompt
    - **Why:** Separates prompt engineering from hook logic, makes prompts easier to iterate on
    - **Testing:** Ensure buildPrompt produces identical output when called from new location
  - [ ] 1.3 Create `src/services/SourceFormatterService.ts` and extract data transformation logic 
    - **What:** Extract functions: `convertToMessageSources` (line 280), `deduplicateSources` (line 420), `isHigherQualitySource` (line 526), `isHigherQualityCardSource` (line 548)
    - **How:** Create new service file, move these functions with their dependencies, export each function
    - **Why:** Separates data transformation logic from hook state management
    - **Types needed:** Import `MessageSources`, `Source`, `RuleSource`, `CardSource` types from existing files
  - [ ] 1.4 Refactor `useGameRules.ts` to use new modules and focus on react-query orchestration
    - **What:** Update useGameRules.ts to import from new modules, remove extracted code, keep the hook interface identical
    - **How:** Replace extracted functions with imports, ensure all existing function calls still work
    - **Why:** Hook becomes focused on state management and API orchestration only
    - **Critical:** External components using this hook should require zero changes
  - [ ] 1.5 Update imports across the application to use new centralized types
    - **What:** Find and update any files importing the old duplicate `VectorSearchResult` definitions
    - **How:** Use global search for "VectorSearchResult" and update import statements
    - **Why:** Ensures all code uses the centralized type definition

- [ ] 2.0 Refactor `QueryPreprocessorService.ts`: Decompose into smaller modules
  - [ ] 2.1 Create `src/services/query-processing/` directory
    - **What:** Create new directory structure for query processing modules
    - **How:** `mkdir -p src/services/query-processing` or create through VS Code
    - **Why:** Groups related query processing functionality together
  - [ ] 2.2 Create `src/services/query-processing/queryClassifier.ts` and extract `classifyQuery` function
    - **What:** Move `classifyQuery` function (lines 29-178) and `QueryType` enum (lines 11-24) to new file
    - **How:** Copy function with all its logic, export both the enum and function
    - **Why:** Query classification is a distinct responsibility separate from preprocessing
    - **Dependencies:** Function has no external dependencies, self-contained logic
  - [ ] 2.3 Create `src/services/query-processing/queryExpander.ts` and extract `expandQueryByType` function
    - **What:** Move `expandQueryByType` function (lines 180-262) to new file
    - **How:** Copy function, import `QueryType` from queryClassifier.ts, export function
    - **Why:** Query expansion logic is separate from classification and follow-up handling
    - **Dependencies:** Needs `QueryType` enum from queryClassifier module
  - [ ] 2.4 Create `src/services/query-processing/followUpHandler.ts` and extract follow-up functions
    - **What:** Move `detectFollowUp` (line 263) and `reformulateFollowUp` (lines 286-339) functions
    - **How:** Copy both functions, import `Entity` type if needed, export both functions
    - **Why:** Follow-up detection and reformulation are related but separate from other query processing
    - **Dependencies:** May need `Entity` type from EntityExtractionService
  - [ ] 2.5 Refactor `QueryPreprocessorService.ts` to compose new modules and maintain existing `preprocessQuery` function
    - **What:** Update main service to import from new modules, remove extracted code, keep `preprocessQuery` function working
    - **How:** Replace extracted functions with imports, ensure `preprocessQuery` (lines 340-387) continues to work identically
    - **Why:** Maintains backward compatibility while using decomposed modules internally
    - **Critical:** Any code calling `preprocessQuery` should work unchanged

- [ ] 3.0 Refactor Backend: Centralize Configuration
  - [ ] 3.1 Create `backend/config/` directory
    - **What:** Create new directory for backend configuration files
    - **How:** `mkdir -p backend/config` or create through VS Code
    - **Why:** Centralizes configuration management separate from business logic
  - [ ] 3.2 Create `backend/config/ingestionConfig.ts` and extract all hardcoded configurations
    - **What:** Extract these constants from `ingestArcsRules.ts` and `ingestionService.ts`:
      - `ARCS_DATA_DIR` (file path resolution)
      - `ARCS_MARKDOWN_FILES` array (list of 9 files)
      - `ARCS_FILE_MAPPINGS` object (natural language mappings)
      - `FILE_GROUPS` object (predefined file groups)
      - `EMBEDDINGS_TABLE_NAME` ('arcs_rules_embeddings')
      - `PROCESSING_BATCH_SIZE` (5 for main script, 20 for service)
    - **How:** Create config object with all constants, export as named exports or default object
    - **Why:** Eliminates duplication between scripts and provides single place to change settings
    - **Note:** Keep environment variables (SUPABASE_URL, keys) in their current locations
  - [ ] 3.3 Update `backend/scripts/ingestArcsRules.ts` to use centralized configuration
    - **What:** Replace hardcoded constants (lines 22-42) with imports from config file
    - **How:** Import config object, replace const declarations with references to config properties
    - **Why:** Removes duplication and makes script configuration-driven
    - **Test:** Ensure script runs identically after changes
  - [ ] 3.4 Update `backend/services/ingestionService.ts` to use centralized configuration
    - **What:** Replace hardcoded constants (lines 13-61) with imports from config file
    - **How:** Import config object, replace const declarations with config references
    - **Why:** Both scripts now use same configuration source
    - **Test:** Ensure ingestion service functions work identically after changes

- [ ] 4.0 Refactor Backend: Decompose `markdownProcessor.ts` and refine `ingestionService.ts`
  - [ ] 4.1 Create `backend/utils/fileUtils.ts` and extract file metadata logic
    - **What:** Extract functions: `extractFileMetadata` (lines 89-97), `calculateContentHash` (lines 82-84), `extractH1Heading` (lines 63-77)
    - **How:** Create new utility file, move these functions with their dependencies, export each function
    - **Why:** File operations are separate responsibility from markdown processing
    - **Dependencies:** Needs `crypto`, `fs`, `path` modules and `unified`/`remarkParse` for H1 extraction
  - [ ] 4.2 Create `backend/utils/chunkingRules.ts` and extract content-type specific rules
    - **What:** Extract functions: `determineContentType` (lines 102-118), `getChunkSizesForContentType` (lines 124-168)
    - **How:** Move functions to new file, import `Chunk` type for function signatures, export functions
    - **Why:** Content type logic is separate from actual chunking mechanics
    - **Dependencies:** Needs `Chunk` type from markdownProcessor for function signatures
  - [ ] 4.3 Refactor `backend/utils/markdownProcessor.ts` to use new utilities and focus on core chunking logic
    - **What:** Update markdownProcessor to import from new utilities, remove extracted functions, keep `processMarkdownAndChunk` as main export
    - **How:** Replace extracted functions with imports, ensure main function continues to work identically
    - **Why:** File becomes focused purely on the chunking algorithm and markdown parsing
    - **Critical:** The `processMarkdownAndChunk` function must work exactly the same as before
  - [ ] 4.4 Refactor `backend/services/ingestionService.ts` to focus solely on command parsing and orchestration
    - **What:** Keep command parsing functions (`parseIngestionCommand`, `listIngestionCommands`, `executeIngestionCommand`), remove any file processing logic
    - **How:** Ensure service only handles natural language commands and delegates actual ingestion to main script
    - **Why:** Service becomes focused on command interface, not file processing implementation
    - **Current focus:** File is already mostly focused on this, verify separation is clean
  - [ ] 4.5 Ensure `backend/scripts/ingestArcsRules.ts` remains the primary workflow script
    - **What:** Verify this script handles the complete ingestion workflow: file detection, processing, embedding generation, database insertion
    - **How:** Review script to ensure it's the authoritative implementation of the ingestion process
    - **Why:** Clear separation: service handles commands, script handles actual work
    - **No changes needed:** This is verification that roles are properly separated

- [ ] 5.0 Finalize Code Quality: Standardize Logging and Update Documentation
  - [ ] 5.1 Review and clean up `console.log` statements across all refactored files
    - **What:** Go through each refactored file and review all `console.log`, `console.error`, `console.warn` statements
    - **How:** Search for "console." in each file, evaluate if each log adds value or is debug noise
    - **Keep:** Logs for process start/end, major errors, important lifecycle events
    - **Remove:** Debug logs, verbose progress logs, temporary debugging statements
    - **Files to review:** All files created/modified in tasks 1-4
  - [ ] 5.2 Retain meaningful lifecycle and error logging, remove debug logs
    - **What:** Establish consistent logging patterns across the refactored codebase
    - **Guidelines:** 
      - Keep: "Starting ingestion", "Ingestion complete", major errors
      - Remove: "Processing chunk X of Y", detailed debug information
      - Error logs should include enough context for debugging
    - **Why:** Clean, meaningful logs improve maintainability without noise
  - [ ] 5.3 Test all refactored functionality to ensure zero regressions
    - **What:** Manual testing of key functionality after all refactoring is complete
    - **Frontend testing:** 
      - GameChat component works identically 
      - Search queries return same results
      - No TypeScript errors or import issues
    - **Backend testing:**
      - Run ingestion script to verify it works unchanged
      - Test MCP command parsing with sample commands
      - Verify configuration changes don't break functionality
    - **Critical:** All existing functionality must work exactly as before
  - [ ] 5.4 Update `project-docs/project-tech.md` with new architecture and file structure documentation
    - **What:** Add new section documenting the refactored architecture in existing `project-docs/project-tech.md` file
    - **Content to add:**
      - New directory structure (`src/prompts/`, `src/services/query-processing/`, `backend/config/`)
      - Purpose of each new module and service
      - How the refactored architecture improves maintainability
    - **How:** Add section after existing "Project Structure" (around line 126), maintain existing formatting style
    - **Why:** Keeps architecture documentation current and accessible to future developers
  - [ ] 5.5 Verify all imports and dependencies are working correctly across the application
    - **What:** Final verification that all import statements work and TypeScript compiles cleanly
    - **How:** 
      - Run `npm run build` to check for TypeScript errors
      - Run `npm run dev` to verify frontend starts without issues
      - Check that all new imports resolve correctly
    - **Fix:** Any import errors or missing dependencies
    - **Success criteria:** Clean build with no errors or warnings related to refactoring changes 