# SPEC — Daily Suspect game design

## Core loop (one session ≈ 2 minutes)
pick case → briefing (evidence) → interrogation room → break them OR accuse → stamp verdict → share grid → next case

## Hypothesis
A capped, tap-first interrogation with visible composure feedback is more compelling per minute than open-ended chat interrogation, and the emoji share grid drives organic return play.

## Systems

### Composure
- Each case starts at `startComposure` (EASY 40 / MEDIUM 65 / HARD 90).
- Every question yields a model-judged delta in [-35, 0], clamped server-side.
- Big hits (≤ -18) trigger screen shake, polygraph flash, heavy thud.
- 0 composure = cracked: canonical confession, auto-win.

### Tactics
PRESSURE / EMPATHY / LOGIC / BLUFF. Each persona resists at least one tactic (defined in prose inside `persona`). Suggested chips always offer 3 different tactics so players learn the matchup by experimenting.

### Question budget
Hard cap per case. Hitting 0 forces the accusation screen. Counter turns red with 2 left.

### Intel
2 fragments per case, unlocked when composure crosses 66% / 33% of start. Fragments hint at the correct theory — they reward aggressive play with accusation accuracy.

### Theories & verdict
4 theories, 1 correct. Cracked = CONFESSED stamp. Correct theory = CASE CLOSED. Wrong = WALKED FREE.

### Ranks
- S: cracked in ≤ 45% of budget
- A: cracked in ≤ 75%
- B: cracked late, or correct theory with both intel fragments
- C: correct theory, little intel
- F: walked free

### Share grid
```
DAILY SUSPECT — <case>
❓❓❓✅ CONFESSION in 3/8 · RANK S
🫀 composure 65 → 0 · biggest hit −28
```

## Tone rules for case writing
- Hidden truths should have a human twist (protecting someone, misguided love, pride) — pure villainy is allowed only at HARD.
- Comedy cases (Lucas) and local-flavor cases (Rosie, Singlish) are first-class categories, not gimmicks.
- The reveal must recontextualize at least one briefing fact (e.g. the CCTV move, the frosting "paint").
