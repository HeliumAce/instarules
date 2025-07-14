-- Add sources column to chat_messages
ALTER TABLE chat_messages ADD COLUMN sources JSONB DEFAULT NULL;

-- Add an index for better query performance on sources
CREATE INDEX IF NOT EXISTS idx_chat_messages_sources ON chat_messages USING GIN (sources); 