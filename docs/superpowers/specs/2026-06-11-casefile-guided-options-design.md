# Casefile — Guided Play Options (Design Spec)

Date: 2026-06-11 · Status: design, approved; not yet planned/built · Track: Casefile mode only.

## Goal
Make the Casefile interrogation room playable mostly by **tapping**, not just free-form typing — lower the
"what do I even ask / I don't want to type" friction the playtesters flagged — via a guided options menu,
with an **Assisted (default) / Classic** difficulty toggle so the deduction survives for players who want it.

## NON-NEGOTIABLE: additive, Casefile-only
The daily game is untouched. The daily already has suggestion chips; this work touches only the Casefile
path (`/api/season/*`, `components/Casefile.tsx`, `backend/season-*.mjs`, `backend/seasons.mjs`). Daily
`npm test` stays green as the proof.

## The guided menu (interrogation room, below the conversation)
- **"Ask about …" topic chips** — one per *unbroken* topic the active suspect has (e.g. *Ask about her
  night · Ask about Veridian*). Always present, **both modes**. Tapping asks an authored, spoiler-free
  question about that line of inquiry (no typing). Shown for present-only topics too — asking stonewalls,
  which is itself informative and triggers the Present nudge.
- **Suggested follow-ups** — after each answer, 2–3 contextual question chips the model proposes (the daily
  pattern, ported). **Both modes.** Run through the existing spoiler-safe normalizer.
- **Present prompt** — mode-dependent:
  - **Assisted:** when the player holds a clue that would crack an unbroken thread of *this* suspect, a chip
    surfaces it by name — *"▣ Present: The medication log →"* — tap to present it.
  - **Classic:** when a suspect stonewalls, a gentle nudge — *"▣ They won't talk without proof — present
    evidence"* — opens the Case File; the **player** chooses the clue.
- **Free-form input** + the manual **Present evidence** button — always available (unchanged).

## Difficulty toggle
- **Assisted (default)** vs **Classic**, persisted in `localStorage` (`ds-casefile-assist`), shown on the
  Casefile cover and in the room header. The client passes `assisted` to the API so the server only computes
  the exact-clue Present hint in Assisted mode (Classic never receives it → no leak).
- The toggle changes **only** the Present-step guidance depth. Topic chips + suggested follow-ups (both
  spoiler-free) are in both modes; the deduction board is unchanged in both (its hints are already
  directional, not answers).

## Backend (`backend/`, additive)
- **`seasons.mjs`:** add an authored `ask` (string) to each thread — the spoiler-free question its topic chip
  sends. Exposed via `toPublicSeason` (it's not a hidden field). The consistency validator gains a check
  that every thread has a non-empty `ask`.
- **`season-app.mjs`:**
  - The interrogate (and present) response gains `suggested` — 2–3 model-proposed follow-ups, added to the
    interrogate prompt and passed through a spoiler-safe normalizer (must not name the culprit/answer).
  - `assistPresent` computation: given `(session, suspectId)`, find a clue in `cluesFound` for which the
    hidden contradiction map has `(clueId, suspectId, unbroken threadId)`; return `{ clueId, title }` (or
    null). Returned **only when the request carries `assisted: true`** — in the interrogate/present responses
    and via a new lightweight `POST /api/season/look { sessionId, suspectId, assisted }` (no model call) used
    on room entry to show the hint before the first question.

## Frontend (`components/Casefile.tsx`)
- Assist toggle state (localStorage, default Assisted), surfaced on cover + room.
- On entering a suspect's room, call `/api/season/look` (with `assisted`) to get `assistPresent`.
- Render the menu: topic chips (unbroken topics, from `case.suspects[].threads[].ask`) + the last response's
  `suggested` follow-ups + the `assistPresent` chip (Assisted, when available) + free-form input + the manual
  Present button. Tapping a topic/suggested chip → `ask(question)`; tapping the Present chip → `present(clueId)`.

## Safety / balance
Topic-ask questions and model suggestions are spoiler-free — they guide *what to probe*, never the answer.
The one genuinely puzzle-shortcutting element (naming the exact clue to Present) is gated to Assisted only,
so Classic preserves the "which clue cracks whom" deduction the testers praised.

## Scope & testing
Self-contained. New tests: `suggested` is spoiler-safe (normalizer rejects answer-naming items);
`assistPresent` returns the correct held-clue-vs-contradiction match for the active suspect and is null in
Classic / when no held clue applies; the per-topic `ask` validator check. Daily `npm test` + `npm run build`
stay green. A short re-playtest (1–2 agents) in each mode to confirm Assisted feels carried and Classic still
demands the deduction.

## Decided
- Guidance shape: a guided menu (topic chips + suggested follow-ups + Present prompt), free-form retained.
- Present depth: a difficulty toggle, Assisted by default; Classic keeps suggestions but not the exact-clue
  Present hint.
