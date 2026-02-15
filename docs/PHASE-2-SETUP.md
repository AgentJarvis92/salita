# PHASE 2 SETUP INSTRUCTIONS

## Manual SQL Execution Required

Supabase doesn't allow programmatic SQL execution from the JavaScript client for security. Tables must be created via the Supabase dashboard SQL Editor.

---

## STEP 1: Open Supabase SQL Editor

1. Go to: https://supabase.com/dashboard/project/wbcfrfpndsczqtuilfsl/sql
2. Click the **"+"** button to create a new query
3. Copy the entire SQL below and paste into the editor
4. Click **"Run"** to execute

---

## STEP 2: Execute This SQL

```sql
-- Feature 2.1: Profiles table
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

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

-- Feature 2.2: Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  tagalog TEXT,
  english TEXT,
  hint TEXT,
  examples JSONB,
  correction TEXT,
  note TEXT,
  tone TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_user_id_created ON messages(user_id, created_at DESC);

-- Feature 2.2: Mistakes table
CREATE TABLE IF NOT EXISTS mistakes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  mistake TEXT NOT NULL,
  correction TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mistakes_user_id_created ON mistakes(user_id, created_at DESC);

-- Feature 2.3: Analytics events table
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_name ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON analytics_events(created_at DESC);
```

---

## STEP 3: Verify Tables Created

After running the SQL, I'll test that all tables exist by running:
```
http://localhost:3000/api/test-schema
```

Expected response:
```json
{
  "success": true,
  "tables": [
    { "table": "profiles", "exists": true },
    { "table": "messages", "exists": true },
    { "table": "mistakes", "exists": true },
    { "table": "analytics_events", "exists": true }
  ],
  "message": "✅ All Phase 2 tables exist"
}
```

---

## Tables Created

### 1. `profiles` table
- Stores user profile data (name, skill_level, goal, selected_tutor)
- One profile per user (UNIQUE constraint on user_id)
- Used in Phase 3 (tutor selection) and Phase 7 (onboarding)

### 2. `messages` table
- Stores full conversation history
- Supports both user messages and AI responses
- JSONB field for examples array
- Used in Phase 4 (chat UI) and beyond

### 3. `mistakes` table
- Stores user mistakes for memory system
- Used in Phase 9 (corrections) and Phase 11 (memory)

### 4. `analytics_events` table
- Tracks product metrics (signup, persona_selected, first_message, etc.)
- JSONB metadata for flexible event data
- Used throughout all phases for success metrics

---

## Ready When:
✅ SQL executed in Supabase dashboard  
✅ Test route confirms all tables exist  
✅ No errors in Supabase logs  

Then we proceed to Feature 2.4: Testing
