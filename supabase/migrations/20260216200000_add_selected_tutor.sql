-- Add selected_tutor column to profiles for persona persistence
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS selected_tutor TEXT CHECK (selected_tutor IN ('ate_maria', 'kuya_josh'));
