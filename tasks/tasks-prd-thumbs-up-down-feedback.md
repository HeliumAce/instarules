# Task List: Thumbs Up/Down Feedback Feature

Based on: `prd-thumbs-up-down-feedback.md`

## Relevant Files

- `supabase/migrations/20250713120000_create_user_feedback_table.sql` - Migration file for user_feedback table (user_id is nullable, feedback is retained/anonymized if user is deleted)
- `project-docs/migrations-history.md` - Documentation of migration baselining and best practices
- `src/pages/GameChat.tsx` - Main chat component where thumbs up/down icons exist and need to be updated for filled state and feedback logic.
- `src/components/ui/FeedbackToast.tsx` - New component for thumbs down feedback toast with radio button options (to be created).
- `src/components/ui/FeedbackToast.test.tsx` - Unit tests for FeedbackToast component.
- `src/hooks/useFeedback.ts` - Custom hook for managing feedback state and submission logic (to be created).
- `src/hooks/useFeedback.test.ts` - Unit tests for useFeedback hook.
- `src/integrations/supabase/client.ts` - Existing Supabase client that may need feedback-related query functions.
- `src/types/game.ts` - Existing types file that may need feedback-related type definitions.
- `src/services/FeedbackService.ts` - Service for handling feedback API calls to Supabase (to be created).
- `src/services/FeedbackService.test.ts` - Unit tests for FeedbackService.
- `src/hooks/use-toast.ts` - Existing toast hook that may need updates for feedback toasts.

### Notes

- Unit tests should typically be placed alongside the code files they are testing (e.g., `FeedbackToast.tsx` and `FeedbackToast.test.tsx` in the same directory).
- Use `npx jest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by the Jest configuration.
- The existing thumbs up/down icons in GameChat.tsx need to be enhanced, not replaced.
- Follow existing toast patterns from the current auth toast notifications.

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
  - [ ] 2.1 Update existing thumbs up/down buttons in GameChat.tsx to show filled state when selected
  - [ ] 2.2 Add proper ARIA labels and accessibility attributes to thumbs up/down buttons
  - [ ] 2.3 Implement visual feedback for icon state changes (filled vs outline)
  - [ ] 2.4 Add hover states for filled icons (mirror existing outline hover states) and active states for better user experience
  - [ ] 2.5 Ensure mobile responsiveness for thumbs up/down buttons
  - [ ] 2.6 Update existing handleFeedback function to work with new feedback system
  - [ ] 2.7 Add loading states during feedback submission (if needed)

- [ ] 3.0 Toast Notification System Implementation
  - [ ] 3.1 Create FeedbackToast component for thumbs down feedback collection
  - [ ] 3.2 Implement radio button group for feedback reasons (not_related, incorrect, poorly_worded, other)
  - [ ] 3.3 Add Submit button and X close button to FeedbackToast
  - [ ] 3.4 Style FeedbackToast to match existing toast patterns (bottom-right positioning)
  - [ ] 3.5 Implement auto-dismiss functionality for thumbs up toast (3 seconds)
  - [ ] 3.6 Add toast animations and transitions consistent with existing UI
  - [ ] 3.7 Handle toast state management (show/hide, content switching)
  - [ ] 3.8 Add keyboard navigation support for radio buttons and submit button
  - [ ] 3.9 Implement toast replacement behavior - new feedback toasts should dismiss previous ones (no stacking)
  - [ ] 3.10 Add unit tests for FeedbackToast component

- [ ] 4.0 Feedback Logic and State Management
  - [ ] 4.1 Create FeedbackService for Supabase API interactions
  - [ ] 4.2 Implement feedback submission logic using UPSERT pattern (INSERT ... ON CONFLICT DO UPDATE) with proper error handling
  - [ ] 4.3 Create useFeedback hook for managing feedback state across components
  - [ ] 4.4 Add feedback type definitions to game.ts types file
  - [ ] 4.5 Implement feedback state persistence (track which messages have feedback)
  - [ ] 4.6 Handle switching between thumbs up/down (clear previous feedback, show appropriate toast)
  - [ ] 4.7 Extract context data (user_question, response_confidence, response_length, session_id) from existing message data
  - [ ] 4.8 Add feedback state to existing message state management
  - [ ] 4.9 Implement optimistic UI updates for immediate feedback
  - [ ] 4.10 Add error handling for network failures during feedback submission
  - [ ] 4.11 Create unit tests for FeedbackService
  - [ ] 4.12 Create unit tests for useFeedback hook

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