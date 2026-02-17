# 🚨 DATABASE FIX REQUIRED

## What Broke

When Google OAuth was removed (commit `2352974`), the app lost the automatic profile creation mechanism. 

**Root cause:** Email signup creates auth.users entries, but never creates corresponding profiles rows. This causes 406 errors when the app tries to query profiles.

## What's Been Fixed

✅ **v7.0 Ate Maria** - Conversational immersion deployed and live  
✅ **RLS policies** - Applied (users can read/write their own data)  
❌ **Profile creation** - Needs manual database fix (below)

## How to Fix (5 minutes)

1. Go to: https://supabase.com/dashboard/project/wbcfrfpndsczqtuilfsl/sql/new
2. Copy the entire contents of `fix-profiles.sql` from this directory
3. Paste into the SQL editor
4. Click "Run"
5. Confirm any warnings (the DROP TRIGGER is safe)

This will:
- Backfill profiles for existing users (including your test account)
- Create auto-trigger for future signups
- Fix all 406 errors immediately

## Files Created

- `fix-profiles.sql` - Complete fix (backfill + trigger)
- `supabase/migrations/20260217_auto_create_profiles.sql` - Trigger migration
- `supabase/migrations/20260217_add_rls_policies.sql` - RLS policies

## After Fix

Once applied:
1. Reload https://salita-production.up.railway.app/dashboard
2. Click "Ate Maria" or "Kuya Josh"
3. Chat should open successfully with v7.0 conversational immersion

Both tutors will work. v7.0 is LIVE and waiting. Just needs the database fix.

---

**Created:** 2026-02-16 20:30 EST  
**Status:** Ready to apply (waiting for manual SQL execution)
