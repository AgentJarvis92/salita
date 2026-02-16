-- Phase 6: Add voice_enabled column to profiles table
-- Tracks user preference for voice mode (persists across sessions)

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS voice_enabled BOOLEAN DEFAULT false;

-- Update RLS policy to allow users to update their own voice_enabled
-- (Existing update policy on profiles should already cover this)
