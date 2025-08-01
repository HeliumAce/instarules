# PRD: Codebase Refactor for Single Responsibility

## 1. Introduction/Overview

This document outlines the requirements for a comprehensive refactoring of the InstaRules codebase. The project has evolved rapidly, leading to several large, multi-purpose files that are becoming difficult to maintain and extend.

The primary goal of this refactor is to improve the codebase's health, maintainability, and scalability by adhering to the **Single Responsibility Principle (SRP)**. Each file and module should have one clear, distinct purpose. This effort will establish a cleaner architecture, making future development faster and less error-prone.

## 2. Goals

- **Improve Modularity:** Break down large files (`useGameRules.ts`, `ingestionService.ts`, `markdownProcessor.ts`, `QueryPreprocessorService.ts`) into smaller, single-responsibility modules.
- **Increase Maintainability:** Make the codebase easier to understand, modify, and debug by separating concerns.
- **Centralize Configuration:** Extract hardcoded values (file paths, API settings, LLM prompts) into dedicated, easily accessible configuration files.
- **Reduce Redundancy:** Eliminate duplicate code and unused logic.
- **Standardize Logging:** Implement a consistent logging strategy that provides meaningful output without cluttering the console.
- **Establish Best Practices:** Solidify architectural patterns that can be followed for future development.

## 3. Developer Stories

- **As a developer,** I want to update LLM prompts without digging through complex application logic, so I can iterate on them quickly.
- **As a developer,** I want to change ingestion file paths or batch sizes in one central place, so I can reconfigure the system without searching through multiple scripts.
- **As a developer,** I want each file to have a clear and predictable purpose, so I can navigate the codebase and find relevant logic efficiently.
- **As a developer,** I want to understand the flow of data and state on the frontend, so I can debug issues in the `GameChat` component more effectively.

## 4. Functional Requirements (Refactoring Tasks)

### FR1: Frontend Refactor (`useGameRules.ts` & `QueryPreprocessorService.ts`)

- **FR1.1: Extract Prompt Logic:**
    - Create a new directory: `src/prompts`.
    - Move the `buildPrompt` function from `useGameRules.ts` to a new file: `src/prompts/gameRulesPrompt.ts`.
    - The new module will export a function that constructs and returns the final prompt string.

- **FR1.2: Decompose `useGameRules.ts`:**
    - The core `useGameRules.ts` hook will be simplified to manage `react-query` state and orchestrate calls to other services.
    - Logic for data transformation (e.g., `convertToMessageSources`, `deduplicateSources`) will be extracted into a new service: `src/services/SourceFormatterService.ts`.

- **FR1.3: Decompose `QueryPreprocessorService.ts`:**
    - This service will be broken down into smaller, more focused modules within `src/services/query-processing/`:
        - `queryClassifier.ts`: Contains `classifyQuery`.
        - `queryExpander.ts`: Contains `expandQueryByType`.
        - `followUpHandler.ts`: Contains `detectFollowUp` and `reformulateFollowUp`.
    - The existing `preprocessQuery` function will be refactored to compose these new modules.

### FR2: Backend Refactor (Ingestion & Processing)

- **FR2.1: Centralize Configuration:**
    - Create a new file: `backend/config/ingestionConfig.ts`.
    - Move all hardcoded configurations (`ARCS_FILE_MAPPINGS`, `FILE_GROUPS`, `EMBEDDINGS_TABLE_NAME`, `PROCESSING_BATCH_SIZE`, etc.) from `ingestArcsRules.ts` and `ingestionService.ts` into this new config file.

- **FR2.2: Refine Ingestion Scripts:**
    - `ingestArcsRules.ts` will be the primary script for the ingestion workflow, handling file detection, processing, and database insertion.
    - `ingestionService.ts` will focus solely on parsing natural language commands and orchestrating calls to the main ingestion script.

- **FR2.3: Decompose `markdownProcessor.ts`:**
    - Core chunking logic (`processMarkdownAndChunk`) will remain.
    - File metadata logic (`extractFileMetadata`) will move to a new utility: `backend/utils/fileUtils.ts`.
    - Content-type-specific rules (`determineContentType`, `getChunkSizesForContentType`) will move to a new module: `backend/utils/chunkingRules.ts`.

### FR3: General Code Quality

- **FR3.1: Standardize Logging:**
    - Review all `console.log` statements across the refactored files.
    - Remove logs used for temporary debugging.
    - Retain or enhance logs that indicate critical lifecycle events (e.g., process start/end, major errors).

- **FR3.2: Code Documentation:**
    - At the conclusion of the refactor, create a `CODEBASE_OVERVIEW.md` document in the root directory.
    - This document will briefly outline the primary responsibility of each main directory and key module, serving as a quick reference guide.

## 5. Non-Goals (Out of Scope)

- No new user-facing features will be added.
- The existing database schema will not be altered.
- The functionality or existence of `testIncrementalIngestion.ts` and `testSearchQuality.ts` will not be changed.
- No major changes will be made to UI components.

## 6. Design Considerations

- The refactored architecture will emphasize modularity and composability.
- On the frontend, complex hooks will be broken down into simpler, reusable hooks and services.
- On the backend, scripts will be driven by configuration, and large utilities will be decomposed into smaller, single-purpose functions.

## 7. Success Metrics

- A measurable reduction in the line count of key monolithic files (`useGameRules.ts`, `ingestionService.ts`, etc.).
- The creation of new, clearly-defined modules and services that adhere to SRP.
- Zero functional regressions in the application.
- The successful creation of the `CODEBASE_OVERVIEW.md` document.

## 8. Open Questions

- Are there any other files or modules that feel particularly complex or brittle and should be considered for this refactor?
- Is the proposed file structure (`src/prompts`, `src/services/query-processing/`, `backend/config`) agreeable? 