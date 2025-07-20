# Task List: Thumbs Up/Down Feedback Feature

Based on: `prd-thumbs-up-down-feedback.md`

## Relevant Files

- `supabase/migrations/20250713120000_create_user_feedback_table.sql` - Migration file for user_feedback table (user_id is nullable, feedback is retained/anonymized if user is deleted)
- `project-docs/migrations-history.md` - Documentation of migration baselining and best practices
- `src/pages/GameChat.tsx` - Main chat component where thumbs up/down icons exist and need to be updated for filled state and feedback logic.
- `src/components/ui/FeedbackToast.tsx` - New component for thumbs down feedback toast with radio button options (to be created).

- `src/hooks/useFeedback.ts` - Custom hook for managing feedback state and submission logic (to be created).
- `src/hooks/useFeedback.test.ts` - Unit tests for useFeedback hook.
- `src/integrations/supabase/client.ts` - Existing Supabase client that may need feedback-related query functions.
- `src/types/game.ts` - Existing types file that may need feedback-related type definitions.
- `src/services/FeedbackService.ts` - Service for handling feedback API calls to Supabase with UPSERT pattern and error handling.
- `src/services/FeedbackService.test.ts` - Unit tests for FeedbackService.
- `src/hooks/use-toast.ts` - Existing toast hook that may need updates for feedback toasts.

### Notes

- Unit tests should typically be placed alongside the code files they are testing (e.g., `FeedbackToast.tsx` and `FeedbackToast.test.tsx` in the same directory).
- Use `npx jest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by the Jest configuration.
- The existing thumbs up/down icons in GameChat.tsx need to be enhanced, not replaced.
- Follow existing toast patterns from the current auth toast notifications.

## Implementation Plan: Thumbs Down Radio Button Flow

### Current State Analysis
- ✅ FeedbackToastContent component exists with radio buttons and submit button
- ✅ Basic thumbs up/down toast functionality works
- ✅ Icons show filled state when selected
- ✅ Thumbs down toast shows radio buttons and reason selection
- ✅ State management for selected feedback reason implemented
- ✅ Submission flow for detailed feedback implemented (console logging)
- ✅ **Task 4.1.1 Complete**: Supabase types generated for user_feedback table
- ✅ **Task 4.1.2 Complete**: Feedback type definitions added to game.ts
- ✅ **Task 4.1.3 Complete**: Full context data extraction implemented
- 🔄 **Ready for Task 4.2.1**: All prerequisites complete - ready to create FeedbackService

### Target User Flow
1. **User clicks thumbs down** → Icon fills, thumbs down toast appears with radio buttons
2. **User selects reason** → Submit button becomes enabled
3. **User clicks Submit** → Toast dismisses, feedback logs to console, confirmation toast appears
4. **User sees confirmation** → "Thank you for your feedback!" toast appears and auto-dismisses

### Technical Implementation Strategy

#### ✅ **Phase 1: UI Components (Completed - Tasks 2.0 & 3.0)**
- Thumbs up/down icons with filled states ✅
- FeedbackToastContent with radio buttons ✅ 
- Toast management and user flow ✅

#### 🔄 **Phase 2: Backend Integration Prerequisites (Task 4.1)**
```typescript
// Task 4.1.1: Regenerate Supabase types
npx supabase gen types typescript --local > src/integrations/supabase/types.ts

// Task 4.1.2: Add feedback types to game.ts
export interface UserFeedback {
  id: string;
  gameId: string;
  feedbackType: 'thumbs_up' | 'thumbs_down';
  userQuestion: string;
  messageId: string;
  feedbackReason?: 'not_related' | 'incorrect' | 'poorly_worded' | 'other';
  responseConfidence?: string;
  responseLength?: number;
  userId?: string;
  sessionId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Task 4.1.3: Extract context data in handleFeedbackSubmission
const handleFeedbackSubmission = (messageId: string, reason: FeedbackReason) => {
  const message = messages.find(m => m.id === messageId);
  const userMessage = findUserQuestionForMessage(messageId);
  
  const feedbackData: UserFeedback = {
    gameId,
    feedbackType: 'thumbs_down',
    userQuestion: userMessage?.content || '',
    messageId,
    feedbackReason: reason,
    responseConfidence: message?.confidence,
    responseLength: message?.content.length,
    userId: user?.id,
    sessionId: generateSessionId(), // TODO: Implement session tracking
  };
  
  // Pass to FeedbackService (Task 4.2.1)
};
```

#### 📋 **Phase 3: Service Implementation (Task 4.2)**
- FeedbackService with UPSERT pattern
- Error handling and validation  
- Integration with existing toast system

#### 🎯 **Phase 4: Enhanced UX (Task 4.3-4.4)**
- useFeedback hook for state management
- Optimistic updates and loading states
- Feedback switching and persistence

### Key Implementation Challenges & Solutions

1. **Toast Content Replacement**: Replace static description with React component
2. **State Management**: Track feedback reason per message ID
3. **Toast Lifecycle**: Proper dismiss/show sequence for smooth UX
4. **Error Handling**: Graceful handling of submission failures
5. **State Cleanup**: Clear feedback reason state after submission

## Tasks

- [ ] 1.0 Database Setup and Migration
  - [x] 1.1 Create SQL migration file with timestamp naming convention
  - [x] 1.2 Define user_feedback table schema with all required fields (id, game_id, feedback_type, user_question, message_id, feedback_reason, response_confidence, response_length, user_id, session_id, created_at, updated_at)
  - [x] 1.3 Add CHECK constraints for feedback_type and feedback_reason enums
  - [x] 1.4 Create UNIQUE constraint on (user_id, message_id) and implement UPSERT logic to handle feedback changes (INSERT ... ON CONFLICT DO UPDATE to keep last response when users change thumbs up/down)
  - [x] 1.5 Add foreign key constraints to chat_messages and auth.users tables
  - [x] 1.6 Create database indexes for performance (user_id, game_id, created_at, message_id)
  - [x] 1.7 Enable Row Level Security (RLS) on user_feedback table
  - [x] 1.8 Create basic RLS policies (INSERT policy for authenticated users, SELECT policy for service_role/admin access)
  - [x] 1.9 Test migration by running supabase db reset locally
  - [x] 1.10 Deploy migration to production using supabase db push

- [ ] 2.0 UI Component Updates for Feedback Icons
  - [x] 2.1 Update existing thumbs up/down buttons in GameChat.tsx to show filled state when selected
  - [x] 2.2 Add proper ARIA labels and accessibility attributes to thumbs up/down buttons
  - [x] 2.3 Implement visual feedback for icon state changes (filled vs outline)
  - [x] 2.4 Add hover states for filled icons (mirror existing outline hover states) and active states for better user experience
  - [x] 2.5 Ensure mobile responsiveness for thumbs up/down buttons
  - [x] 2.6 Update existing handleFeedback function to work with new feedback system

- [ ] 3.0 Toast Notification System Implementation
  - [x] 3.1 Create FeedbackToast component for thumbs down feedback collection
  - [x] 3.2 Implement radio button group for feedback reasons (not_related, incorrect, poorly_worded, other)
  - [ ] 3.3 Integrate FeedbackToast with thumbs down flow
    - [x] 3.3.1 Add state management for selected feedback reason in GameChat
    - [x] 3.3.2 Replace thumbs down toast description with FeedbackToastContent component
    - [x] 3.3.3 Implement onReasonSelect callback to update local state
    - [x] 3.3.4 Implement onSubmit callback to handle feedback submission
    - [x] 3.3.5 Ensure Submit button is disabled until reason is selected
    - [x] 3.3.6 Add toast dismiss functionality on successful submission
  - [x] 3.4 Implement thumbs down submission flow
    - [x] 3.4.1 Create feedback submission function that logs feedback data
    - [x] 3.4.2 Dismiss thumbs down toast after successful submission
    - [x] 3.4.3 Show "Thank you for your feedback!" confirmation toast
    - [x] 3.4.4 Clear feedback reason state after submission
    - [x] 3.4.5 Handle error cases (show error toast if submission fails)
  - [x] 3.5 Remove auto-dismiss functionality for initial thumbs down toast with radio buttons
  - [x] 3.6 Add toast animations and transitions consistent with existing UI
  - [x] 3.7 Handle toast state management (show/hide, content switching)
  - [x] 3.8 Add keyboard navigation support for radio buttons and submit button
- [x] 3.9 Implement toast replacement behavior - new feedback toasts should dismiss previous ones (no stacking)
- [x] 3.10 Add unit tests for FeedbackToast component (deferred for systematic testing approach)
- [x] 3.11 Improve toast radio button / form styling for better visibility and contrast

- [ ] 4.0 Feedback Logic and State Management
  - [ ] 4.1 **Prerequisites for Backend Integration**
      - [x] 4.1.1 Regenerate Supabase types to include user_feedback table schema (run `npx supabase gen types typescript --local > src/integrations/supabase/types.ts`)
      - [x] 4.1.2 Add feedback type definitions to game.ts types file
      - [x] 4.1.3 Extract context data (user_question, response_confidence, response_length, session_id) from existing message data in GameChat
  - [x] 4.2 **Core Service Implementation**
    - [x] 4.2.1 Create FeedbackService for Supabase API interactions with all required fields
    - [x] 4.2.2 Implement feedback submission logic using UPSERT pattern (INSERT ... ON CONFLICT DO UPDATE) with proper error handling
    - [x] 4.2.3 Update handleFeedbackSubmission in GameChat to collect and pass all required data to FeedbackService
  - [ ] 4.3 **State Management and Hooks**
    - [ ] 4.3.1 Create useFeedback hook for managing feedback state across components
    - [ ] 4.3.2 Implement feedback state persistence (track which messages have feedback)
    - [ ] 4.3.3 Add feedback state to existing message state management
  - [ ] 4.4 **Enhanced User Experience**
    - [ ] 4.4.1 Handle switching between thumbs up/down (clear previous feedback, show appropriate toast)
    - [ ] 4.4.2 Implement optimistic UI updates for immediate feedback
    - [ ] 4.4.3 Add loading states during feedback submission (moved from Task 2.7)
    - [ ] 4.4.4 Add error handling for network failures during feedback submission

- [ ] 5.0 Integration Testing and Validation
  - [ ] 5.1 Test complete thumbs up flow (click → icon fill → toast → auto-dismiss)
  - [ ] 5.2 Test complete thumbs down flow (click → icon fill → toast → reason selection → submit)
  - [ ] 5.3 Test feedback switching (thumbs up to thumbs down and vice versa) and verify UPSERT behavior keeps last response
  - [ ] 5.4 Verify feedback data is correctly stored in Supabase with all required fields
  - [ ] 5.5 Test RLS policies: authenticated users can insert feedback, service_role can read all feedback for admin access
  - [ ] 5.6 Test UPSERT behavior: changing thumbs down reasons updates existing feedback rather than creating duplicates
  - [ ] 5.7 Test feedback submission with various message types and games
  - [ ] 5.8 Test toast behavior on mobile devices and different screen sizes
  - [ ] 5.9 Test keyboard navigation and accessibility features
  - [ ] 5.10 Test error scenarios (network failures, invalid data, unauthorized access)
  - [ ] 5.11 Verify feedback state persists correctly across page reloads
  - [ ] 5.12 Test feedback analytics queries work correctly in Supabase dashboard 