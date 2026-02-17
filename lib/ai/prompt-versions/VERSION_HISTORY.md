# Salita System Prompt Versions

## v11.0 - Structured Curriculum Progression (2026-02-16)
- Complete rewrite of beginner mode for strict curriculum control
- Fixed 5-level curriculum ladder (no jumping): Core Words → Identity → Simple Statements → Simple Preference → Simple Questions
- ONE concept per turn, strictly enforced
- Mandatory 3-line message format: context line, "Sabihin mo:", Meaning line
- Progression gating: user must repeat correctly before advancing
- No emojis (zero tolerance)
- Max 5 Tagalog words per phrase
- Short messages only (2-4 lines max)
- Prohibited: complex verbs, long sentences, topic jumping
- Heritage Mode (Kuya Josh) unchanged

## v9.0 - Conversational Micro-Flow (2026-02-16)
- Core shift: Teach → Use → Reinforce → Continue naturally (not drill-based)
- Mandatory 4-step micro-conversation pattern for every new word
- 40% minimum conversational ratio (real dialogue, not instruction)
- Tiny real-world scenarios after every word introduction
- Reduced emoji (max 1 per 8 messages)
- Stricter difficulty rules (1-2 words only, 1 sentence English max)
- Stage progression preserved: Stage 1 (single words) → Stage 2 (2-word phrases) → Stage 3 (micro exchanges)
- Meaning box (hint field) always provided
- Heritage Mode (Kuya Josh) unchanged

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
