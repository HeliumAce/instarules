# PRD: GameChat Component Refactoring

## Introduction/Overview

The GameChat.tsx component has grown to 778 lines and violates the single responsibility principle, making it difficult to maintain and scale. This refactoring will decompose the monolithic component into focused, testable modules while preserving all existing functionality and fixing a critical source click bug. The goal is to create a maintainable codebase that follows modern engineering best practices without changing any UI behavior.

## Goals

1. **Maintainability**: Reduce GameChat.tsx from 778 lines to ~150 lines through strategic component extraction
2. **Code Quality**: Implement unit testing framework and achieve meaningful test coverage for critical functionality
3. **Bug Fix**: Correct source click behavior to show rule content instead of triggering AI responses
4. **Best Practices**: Align codebase with modern React patterns and established conventions
5. **Scalability**: Create a structure that can grow without becoming unwieldy
6. **Zero UI Changes**: Maintain identical user interface and experience throughout refactoring

## User Stories

**As a developer maintaining the codebase:**
- I want to easily locate and modify specific functionality (sources, feedback, messaging) so that I can implement changes quickly and safely
- I want unit tests for critical functions so that I can refactor with confidence and catch regressions early  
- I want consistent code organization so that I can onboard new team members efficiently

**As a user of the application:**
- I want source clicks to show me the actual rule content so that I can reference specific rules during gameplay
- I want all existing functionality to work exactly as before so that my workflow is not disrupted

**As a code reviewer:**
- I want focused, single-responsibility components so that I can review changes effectively
- I want clear separation of concerns so that I can understand the impact of modifications

## Functional Requirements

### Component Extraction Requirements
1. Extract `MessageItem.tsx` component from lines 615-700 with identical rendering behavior
2. Extract `SourcesList.tsx` component from lines 60-150 with enhanced content display capability
3. Extract `FeedbackButtons.tsx` component from lines 650-690 with identical interaction behavior
4. Extract `ChatInput.tsx` component from lines 730-778 with identical form submission behavior
5. Create `SourceModal.tsx` component using existing Dialog component to display full rule content when sources are clicked
6. Consolidate utility functions into `utils.ts` file (generateSessionId, findUserQuestionForMessage)
7. Create GameChat-specific hooks file for any extracted hook logic

### Testing Requirements
8. Implement Vitest testing framework with React Testing Library
9. Create focused unit tests for utility functions (generateSessionId, findUserQuestionForMessage)
10. Create component tests focusing on user behavior and interactions, not implementation details
11. Create integration tests to ensure refactored components work together correctly
12. Test user behavior, not internal implementation or edge cases that don't affect users

### Bug Fix Requirements  
13. Update Source interface to include `content` field for displaying actual rule text
14. Modify `convertToMessageSources` function to preserve content from vector search results
15. Replace source click AI response behavior with direct content modal display
16. Ensure source modal displays formatted rule content using ReactMarkdown and existing Dialog component

### Code Quality Requirements
17. Maintain identical CSS classes, styling, and interactive behavior across all extracted components
18. Ensure no bundle size increase or performance degradation
19. Follow existing codebase patterns and directory structure conventions
20. Remove duplicate code patterns and consolidate repeated logic

## Non-Goals (Out of Scope)

1. **UI/UX Changes**: No modifications to visual design, styling, or user interface elements
2. **New Features**: No additional functionality beyond fixing the source click bug
3. **Performance Optimization**: No focus on performance improvements unless they're free side effects
4. **Architecture Overhaul**: No changes to hooks, state management patterns, or data flow beyond extraction
5. **Responsive Design**: No modifications to mobile/desktop layout behavior
6. **Accessibility Improvements**: No new accessibility features (maintain existing level)
7. **Bundle Optimization**: No webpack/bundling configuration changes

## Design Considerations

### Directory Structure
Follow existing codebase patterns with minimal new structure:
```
src/pages/
├── GameChat.tsx                 # Main orchestrator (~150 lines)
└── GameChat/                    # Supporting components only
    ├── MessageItem.tsx          # Complex message rendering logic
    ├── SourcesList.tsx          # Complex source categorization logic  
    ├── FeedbackButtons.tsx      # Self-contained feedback feature
    ├── ChatInput.tsx            # Self-contained input form
    ├── utils.ts                 # GameChat-specific utilities
    ├── hooks.ts                 # GameChat-specific hooks (if needed)
    └── index.ts                 # Clean exports

src/components/ui/               # Only truly reusable components
└── (existing Dialog component)  # Use existing Dialog for SourceModal
```

### Component Interface Design
- Pass exact same props/data structures to maintain compatibility
- Use identical CSS classes and styling patterns
- Preserve all existing ARIA labels and accessibility attributes
- Maintain existing event handler signatures and behaviors

## Technical Considerations

### Testing Setup
- Configure Vitest with jsdom environment for React component testing
- Add React Testing Library for user-behavior focused testing
- Create test utilities and setup files for consistent testing patterns
- Focus on testing user behavior and interactions, not implementation details
- Avoid testing edge cases that don't affect user experience

### Source Content Pipeline Fix
- Extend BaseSource interface to include content field
- Modify convertToMessageSources to preserve vector search content
- Ensure backwards compatibility with existing source data structures

### Incremental Development Strategy
- Use smaller commits within single PR for granular review
- Implement extract-test-validate cycle for each component
- Maintain working application state throughout development process

## Success Metrics

1. **Code Organization**: GameChat.tsx reduced from 778 lines to ~150 lines
2. **Component Count**: 4-5 focused components extracted with single responsibilities
3. **Test Coverage**: Meaningful unit test coverage for all utility functions and critical component behaviors
4. **Zero Regressions**: All existing functionality works identically after refactoring
5. **Bug Resolution**: Source clicks display actual rule content instead of triggering AI responses
6. **Code Quality**: No duplicate code patterns, consistent with existing codebase conventions
7. **Developer Experience**: New team members can understand component structure within first day

## Implementation Phases

### Phase 1: Testing Foundation & Utilities (1-2 commits)
- Set up Vitest testing framework and configuration
- Extract and test utility functions (generateSessionId, findUserQuestionForMessage)
- Focus on user behavior testing, not implementation details
- Validate utilities work correctly in isolation

### Phase 2: Source Content Pipeline Fix (2-3 commits)  
- Update Source interface to include content field
- Fix convertToMessageSources to preserve content from vector search
- Create and test SourceModal component
- Validate source content is available for display

### Phase 3: Component Extraction (4-5 commits)
- Extract MessageItem component with tests
- Extract SourcesList component with fixed click behavior and tests
- Extract FeedbackButtons component with tests  
- Extract ChatInput component with tests
- Validate each component works identically to original

### Phase 4: Integration & Cleanup (1-2 commits)
- Update main GameChat.tsx to use extracted components
- Run comprehensive integration testing
- Remove any remaining duplicate code
- Final validation of complete functionality

## Open Questions

1. Should we add PropTypes or additional TypeScript strictness during refactoring?
2. Are there any specific code style preferences for the extracted components?
3. Should we document the refactoring decisions for future developers?

## Risk Mitigation

- **Regression Risk**: Comprehensive testing at each phase with identical behavior validation
- **Scope Creep Risk**: Strict adherence to "zero UI changes" constraint  
- **Complexity Risk**: Follow YAGNI principle and existing codebase patterns
- **Integration Risk**: Incremental commits with working application state maintained throughout 