# Casefile Mode — Jury (2026-06-11)

New long-form mode: a serialized closed-circle whodunit ("A Death at Holloway House") solved by
interrogation → cross-examination → deduction. Goal: 5 differently-profiled agents find it fun &
interesting, **8/10**. Played end-to-end via the `/api/season/*` API + key-screen screenshots.

| Juror | Profile | Baseline | v2 | Final |
|-------|---------|:-------:|:--:|:-----:|
| Priya | narrative / IF | 8 | 7 | **8** |
| Maya  | short attention | 6 | 7 | **8** |
| Devon | deduction purist | 7 | 8 | **8** |
| Sam   | QA / critic | 8 | 8 | **8** |
| Carl  | casual non-gamer | 4 | 7 | **8** |

**All five ≥ 8. Every juror solved the case.** (A pre-jury scout also solved it and rated 8.)

## What the iterations fixed
- **Game-breaking → fair:** the board's "you don't have the evidence" message read as *wrong* when a
  player was merely missing one hard-won clue (Carl thought it unwinnable). Now feedback is diagnostic and
  directional ("keep working the suspects" + a proof-shape hint naming what's still needed).
- **Cross-examination is the marquee move, and mandatory:** the killer's topics (and one innocent's) are
  `presentOnly` — talk stonewalls; you must **Present** the contradicting clue. This makes the signature
  mechanic non-skippable AND fogs the killer (stonewalling ≠ guilt — Priya's "over-telegraphed" fix).
- **No soft dead-end:** consolidated the keystone (the eyewitness sighting) so cracking the decoy's alibi
  yields both her exoneration AND the sighting — no more walking past the one clue the solve needs.
- **Less grind, sharper play:** lowered topic resistance so a sharp, evidence-anchored question breaks a
  topic in ~2; distinct suspect registers; in-character hardening (no meta/"web server" breaks).
- **Determinism where it counts:** board lock-ins and the accusation are server-validated (no model call),
  so the puzzle's correctness is exact.

## Jury-praised strengths (preserve)
Watertight fair-play elimination ("Obra Dinn would nod"); the present-the-contradiction gotcha; distinct
suspect voices; the episode cliffhangers; a killer you deduce rather than guess; robust under abuse
(prompt-injection resisted, clean 4xx, no dead-ends).

## Remaining 9→10 ideas (future)
More episodes / a second body / a surviving plausible suspect (real branching); board accepts any
*sufficient* proof set rather than the exact ids; suspects visibly escalate/fray under repeated pressure;
even tighter question→topic routing (or a tap-to-target topic chip).
