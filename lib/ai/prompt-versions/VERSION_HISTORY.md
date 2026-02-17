# Salita System Prompt Versions

## v8.0 - Beginner Stabilized (2026-02-16)
- Rewrote BEGINNER_SYSTEM_PROMPT for gradual progression
- 3-stage invisible progression: Stage 1 (single words) → Stage 2 (2-word phrases) → Stage 3 (micro exchanges)
- Restored Meaning box UI (hint field always populated for beginner)
- Max 2 sentences per message (reduced from 3)
- "Sabihin mo:" soft prompt pattern
- Tone fix: warm, calm, never pushy or drill-sergeant
- Difficulty control: no food/preference topics before Stage 3
- No open-ended questions in first 6 exchanges
- Soft checkpoint after exchanges 4-5
- Heritage Mode (Kuya Josh) unchanged

## v7.0 - Conversational Immersion (2026-02-16)
- Ate Maria as "Filipino friend who texts you"
- Natural texting style with inline Tagalog
- Max 3 sentences per message
- Inline translations in parentheses
- No structured teaching — purely conversational
- Hint field was optional (often "None"), causing Meaning box to not appear
- Too fast for absolute beginners — jumped to food/topics immediately

## v4.1 - QA Fixes (2026-02-15)
- Archived in systemPrompts-old.ts
- Earlier structured approach

## Rollback Instructions
To rollback to v7.0:
```bash
cp lib/ai/prompt-versions/systemPrompts-v7.0-20260216-214100.ts lib/ai/systemPrompts.ts
```

To rollback to v8.0:
```bash
cp lib/ai/prompt-versions/systemPrompts-v8.0-20260216-214200.ts lib/ai/systemPrompts.ts
```

After rollback, redeploy: `cd /path/to/salita && railway up -d`
