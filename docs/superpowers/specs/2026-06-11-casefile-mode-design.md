# Casefile Mode — Serialized Closed-Circle Whodunit (Design Spec)

Date: 2026-06-11 · Status: design, not yet planned/built · Track: separate from the daily game.

## Goal
Add a second, long-form mode to *Daily Suspect*: a **Casefile** — one closed-circle murder
mystery, played over a long sitting (save/resume), solved by **interrogation → cross-examination →
deduction**. Where the daily game is a 2-minute espresso, a Casefile is the full meal (~20–40 min to solve).

## NON-NEGOTIABLE: this is purely additive
The daily game and all 7 daily cases stay **100% untouched**.
- **Unchanged:** `backend/cases.mjs`, endpoints `/api/cases` · `/api/session` · `/api/interrogate` ·
  `/api/accuse`, the daily flow in `components/Game.tsx`, and the `sessions` table. Daily behavior is
  identical; its `npm test` suite keeps passing as the proof.
- **New + separate:** content in `backend/seasons/`, endpoints under `/api/season/*`, a `season_sessions`
  table, and a new **Casefiles** frontend section reached by an added nav entry (the daily case board
  remains the default home).
- **Shared engine = reuse, never fork:** logic both modes use (e.g. `severityToDelta`, prompt-building
  patterns) is lifted into a shared module that *both* import; the daily path is verified unchanged,
  never edited in place.

## Experience / core loop
1. **Open the case** — the body, the scene, the closed cast (~5 suspects), and the goal: name the killer
   **and** prove *how* and *why*, backed by evidence.
2. **Investigate (free-roam)** — interrogate any suspect with the existing engine. Composure is tracked
   **per thread** (a suspect can be cool about the will but sweat about the greenhouse). Good questions on
   a thread lower their guard *there* and yield **statements** (testimony) and **clues** into a shared **Case File**.
3. **Cross-examine (signature move)** — when statement A conflicts with statement B (or with a clue), the
   player **Presents** it: confront a suspect with the contradiction. A real, implicating contradiction
   breaks composure on that point and peels the next layer (a deeper clue, an exposed lie, a lesser secret).
4. **Deduction Board** — collected statements/clues are cards. The board poses the case's key questions —
   **Who? How? Why?** (optionally **When?**) — and for each the player places the *supporting* clue(s). The
   **server validates** each lock-in against the authored solution; you can only lock what your evidence
   truly supports.
5. **The Accusation (finale)** — make the case. A wrong/incomplete accusation is **not** a hard wall: it
   flags *which* deductions are unsupported (without handing over the answer) so the player keeps digging.
   Rank rewards a full, clean solve in fewer questions.

## Episodes
The serialized feel comes from **scripted story gates** layered over the free investigation: hitting a
milestone (break a key alibi, find the weapon) triggers the next beat (e.g. *"Episode 2: The Second Will",
"Episode 4: Someone Else Is Dead"*). Each gate = a cliffhanger + a natural save point + new threads.
Serialized arc, free moment-to-moment.

## Mechanics in engine terms
- **One model call per turn** (keeps the AGENTS rule). An interrogation turn returns the in-character
  reply + severity (per-thread) + which statement/clue (if any) is unlocked.
- **Present** is a special turn: the prompt carries the confronted statement/clue; the authored
  **contradiction map** decides whether it implicates the suspect on that thread; the model handles the
  reaction; the unlock is resolved server-side.
- **Board lock-ins and the final accusation are deterministic server checks — no model call.** Puzzle
  correctness is exact (the variance the daily jury fought over simply can't occur here); the model only
  ever supplies voice and reaction.

## Content model (the real cost: authoring a watertight mystery)
The hard part is the *writing*, not the code. Every cross-exam contradiction must be real and
discoverable; every board answer uniquely supported; the killer deducible but not obvious; no dangling
threads. Safeguards:
- A **"season bible"** is the single source of truth: full timeline, cast, per-thread truths/lies, the
  **clue web**, the **contradiction map**, the **solution** (who/how/why + supporting clues), and **episode gates**.
- Flow: writing agent drafts the bible → **human review (you)** → encode into engine data
  (`backend/seasons/<id>.mjs`) → a **consistency validator** script proves, before ship, that every
  contradiction resolves to a clue, every board answer has support, and the solution is reachable.
- **Hand-craft Season 1 artisanally** to prove the format. A "generate watertight mysteries" pipeline is
  its own hard problem — deferred until the format is proven.

## Architecture
- **Content:** `backend/seasons/<id>.mjs` — cast, per-thread truths/lies, clue web, contradiction map,
  solution, episode gates. Hidden fields never reach the client (same discipline as `cases.mjs`).
- **Endpoints (new, isolated):** `/api/season/list`, `/api/season/start`, `/api/season/interrogate`
  (incl. Present), `/api/season/board` (lock/unlock a deduction), `/api/season/accuse`, `/api/season/state`
  (resume). Daily endpoints untouched.
- **State / save-resume:** new `season_sessions` table on box Postgres holding rich progress — statements
  obtained, clues found, contradictions resolved, board placements, current episode, per-suspect per-thread
  composure. The existing `sessions` table is untouched. Memory store mirror for tests/local.
- **Frontend (new section):** `Casefiles` — case cover → suspect roster → the existing interrogation room
  (reused) → **Case File** (statements + evidence) → **Deduction Board** → finale. Save/resume via backend.
  Reuses the room UI, severity engine, noir design tokens, deploy pipeline.

## Scope — Season 1 (tight, provable)
~5 suspects · 4–5 episodes · ~12–15 clues · ~6–8 key contradictions · board of 3–4 questions
(Who/How/Why/When). Already a 20–40 min solve; contained enough to build and verify. Scale up once proven.

## Build phases (each its own implementation plan)
1. **Engine + data format + consistency validator** (backend; topic interrogation, Present, board
   validation, season state) — API-testable; daily tests stay green.
2. **One hand-crafted season** (the season bible → encoded data → validated).
3. **Casefiles frontend** (roster · room reuse · Case File · Board · finale · save/resume).
4. **Playtest** — an adapted solver-jury (*could you solve it? is it fair? is it gripping? any dead ends or
   unwinnable states?*) + balance pass.

## Testing
- Daily `npm test` unchanged + passing (additive proof).
- New unit tests: season state transitions, Present resolution, board validation, accusation scoring.
- The consistency validator runs in CI/test for every season (no unsupported board answer, no orphan
  contradiction, solution reachable).
- Solver-jury playtest before shipping a season.

## Risks / open questions
- **Authoring effort** is the dominant cost and risk; mitigated by the bible + validator + artisanal-first.
- **Difficulty tuning** of the free-roam investigation (avoid both dead-ends and trivial solves) — the
  solver-jury exists to catch this.
- **Open calls (defaulted; revisit on review):** Season-1 size (~5 suspects / 4–5 episodes); artisanal
  authoring first (vs an early generation pipeline).
- **Entry point UX** (a mode toggle on home vs a dedicated `/casefiles` route) — decide during the
  frontend plan; coordinate with Codex, who owns the landing.
