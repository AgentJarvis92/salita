-- Feature 2.1: User & Profile Tables

-- Users table (check if exists, Supabase Auth may auto-create)
-- If not, we'll reference auth.users directly

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT,
  skill_level TEXT CHECK (skill_level IN ('beginner', 'understand_cant_speak', 'conversational')),
  goal TEXT CHECK (goal IN ('family', 'culture', 'travel', 'relationship', 'other')),
  selected_tutor TEXT CHECK (selected_tutor IN ('ate_maria', 'kuya_josh')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

-- Feature 2.2: Messages & Mistakes Tables

-- Messages table (stores full conversation)
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  tagalog TEXT,
  english TEXT,
  hint TEXT,
  examples JSONB, -- Array of example phrases
  correction TEXT,
  note TEXT,
  tone TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for conversation history queries
CREATE INDEX IF NOT EXISTS idx_messages_user_id_created ON messages(user_id, created_at DESC);

-- Mistakes table (for memory system)
CREATE TABLE IF NOT EXISTS mistakes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  mistake TEXT NOT NULL,
  correction TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for recent mistakes lookup
CREATE INDEX IF NOT EXISTS idx_mistakes_user_id_created ON mistakes(user_id, created_at DESC);

-- Feature 2.3: Analytics Events Table

-- Analytics events table
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for event queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_name ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON analytics_events(created_at DESC);
