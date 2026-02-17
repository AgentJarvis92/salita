-- Add persona column to messages table to separate conversations per tutor
ALTER TABLE messages ADD COLUMN IF NOT EXISTS persona TEXT CHECK (persona IN ('ate_maria', 'kuya_josh'));

-- Update index to include persona for efficient filtering
CREATE INDEX IF NOT EXISTS idx_messages_user_persona_created ON messages(user_id, persona, created_at DESC);
