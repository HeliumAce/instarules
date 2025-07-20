-- Create ENUM types for feedback_type and feedback_reason
CREATE TYPE feedback_type AS ENUM ('thumbs_up', 'thumbs_down');
CREATE TYPE feedback_reason AS ENUM ('not_related', 'incorrect', 'poorly_worded', 'other');

-- Create user_feedback table
CREATE TABLE user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id TEXT NOT NULL,
  feedback_type feedback_type NOT NULL,
  user_question TEXT NOT NULL,
  message_id UUID NOT NULL,
  feedback_reason feedback_reason,
  response_confidence TEXT,
  response_length INTEGER,
  user_id UUID,
  session_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT feedback_reason_check CHECK (
    (feedback_type = 'thumbs_up' AND feedback_reason IS NULL)
    OR (feedback_type = 'thumbs_down')
  ),
  CONSTRAINT unique_user_message_feedback UNIQUE (user_id, message_id),
  CONSTRAINT fk_message_id FOREIGN KEY (message_id) REFERENCES chat_messages(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX idx_user_feedback_user_id ON user_feedback(user_id);
CREATE INDEX idx_user_feedback_game_id ON user_feedback(game_id);
CREATE INDEX idx_user_feedback_created_at ON user_feedback(created_at);
CREATE INDEX idx_user_feedback_message_id ON user_feedback(message_id);

-- Enable Row Level Security (RLS)
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow authenticated users to insert feedback
CREATE POLICY "Allow authenticated insert" ON user_feedback
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- RLS Policy: Allow service_role to select all feedback
CREATE POLICY "Allow service_role select" ON user_feedback
  FOR SELECT USING (auth.role() = 'service_role');

-- Note: Use INSERT ... ON CONFLICT (user_id, message_id) DO UPDATE in application code to implement UPSERT behavior. 