# Tasks: GameChat Component Refactoring

Based on PRD: `tasks/prd-gamechat-refactor.md`

## Relevant Files

- `src/pages/GameChat.tsx` - Main component that needs refactoring from 778 lines to ~150 lines
- `src/pages/GameChat/MessageItem.tsx` - Extract message rendering logic (lines 615-700)
- `src/pages/GameChat/MessageItem.test.tsx` - Unit tests for MessageItem component
- `src/pages/GameChat/SourcesList.tsx` - Extract source list logic (lines 60-150) with fixed behavior
- `src/pages/GameChat/SourcesList.test.tsx` - Unit tests for SourcesList component
- `src/pages/GameChat/FeedbackButtons.tsx` - Extract feedback UI logic (lines 650-690)
- `src/pages/GameChat/FeedbackButtons.test.tsx` - Unit tests for FeedbackButtons component
- `src/pages/GameChat/ChatInput.tsx` - Extract input form logic (lines 730-778)
- `src/pages/GameChat/ChatInput.test.tsx` - Unit tests for ChatInput component
- `src/pages/GameChat/utils.ts` - GameChat-specific utility functions
- `src/pages/GameChat/utils.test.ts` - Unit tests for utility functions
- `src/pages/GameChat/hooks.ts` - GameChat-specific hooks (if needed)
- `src/pages/GameChat/index.ts` - Clean exports for GameChat components
- `src/pages/GameChat/SourceModal.tsx` - GameChat-specific modal using existing Dialog component for displaying rule content
- `src/pages/GameChat/SourceModal.test.tsx` - Unit tests for SourceModal component
- `src/types/game.ts` - Update Source interface to include content field
- `src/hooks/useGameRules.ts` - Fix convertToMessageSources function to preserve content
- `vitest.config.ts` - Vitest testing configuration
- `src/test/setup.ts` - Global test setup and utilities
- `package.json` - Add testing dependencies and scripts

### Notes

- Unit tests should be placed alongside the code files they are testing
- Use `npm run test` to run all tests, `npm run test:watch` for watch mode
- Maintain identical CSS classes and behavior when extracting components
- Each extracted component should have identical props interface to current implementation
- **Testing Philosophy**: Focus on user behavior and interactions, not implementation details
- **Test What Matters**: User can see content, click buttons, submit forms, etc.
- **Avoid Overkill**: Don't test edge cases, CSS classes, or internal implementation

## Tasks

- [ ] 1.0 Set Up Testing Framework and Infrastructure
  - [x] 1.1 Install Vitest, React Testing Library, and related dependencies
  - [x] 1.2 Create `vitest.config.ts` configuration file with jsdom environment
  - [x] 1.3 Create `src/test/setup.ts` with global test setup and utilities
  - [x] 1.4 Add test scripts to `package.json` (test, test:watch, test:coverage)
  - [x] 1.5 Verify testing framework works with a simple test

- [ ] 2.0 Fix Source Content Pipeline and Data Structures
  - [x] 2.1 Update `BaseSource` interface in `src/types/game.ts` to include `content: string` field
  - [x] 2.2 Modify `convertToMessageSources` function in `src/hooks/useGameRules.ts` to preserve `result.content`
  - [x] 2.3 Create `src/pages/GameChat/SourceModal.tsx` component using existing Dialog for displaying rule content
  - [x] 2.4 Create unit tests for `SourceModal.tsx` component
  - [x] 2.5 Verify that sources now contain actual rule content from vector search results

- [x] 3.0 Extract Utility Functions and Create Supporting Files
  - [x] 3.1 Create `src/pages/GameChat/utils.ts` and extract `generateSessionId` function
  - [x] 3.2 Extract `findUserQuestionForMessage` function to `utils.ts`
  - [x] 3.3 Create focused unit tests for both utility functions in `utils.test.ts`
  - [x] 3.4 Create `src/pages/GameChat/index.ts` with clean exports
  - [x] 3.5 Update imports in `GameChat.tsx` to use extracted utilities

- [ ] 4.0 Extract React Components with Identical Behavior
  - [x] 4.1 Extract `MessageItem` component from lines 615-700 with identical rendering
  - [x] 4.2 Create unit tests for `MessageItem` focusing on user behavior (content display, interactions)
  - [x] 4.3 Extract `SourcesList` component from lines 60-150 with source modal integration
  - [x] 4.4 Create unit tests for `SourcesList` focusing on user behavior (source clicks, content display)
  - [x] 4.5 Extract `FeedbackButtons` component from lines 650-690 with identical interaction behavior
  - [x] 4.6 Create unit tests for `FeedbackButtons` focusing on user behavior (thumbs up/down clicks)
  - [ ] 4.7 Extract `ChatInput` component from lines 730-778 with identical form submission
  - [ ] 4.8 Create unit tests for `ChatInput` focusing on user behavior (form submission, input handling)
  - [ ] 4.9 Update `GameChat.tsx` to use all extracted components with identical props

- [ ] 5.0 Integration, Testing, and Final Validation
  - [ ] 5.1 Run comprehensive integration tests to ensure all components work together
  - [ ] 5.2 Verify source click behavior now shows content modal instead of AI response
  - [ ] 5.3 Validate that all existing functionality works identically (visual regression)
  - [ ] 5.4 Confirm `GameChat.tsx` is reduced to ~150 lines as target
  - [ ] 5.5 Remove any duplicate code patterns and clean up unused imports
  - [ ] 5.6 Run full test suite and ensure meaningful test coverage for critical functionality
  - [ ] 5.7 Document any refactoring decisions or component interfaces for future developers 