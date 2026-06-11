# Case Authoring Spec — Daily Suspect

A case is a pure data object in `backend/cases.mjs`. Hidden-truth fields never reach
the browser. Read the THREE existing cases in `backend/cases.mjs` first (lucas / rosie /
elena) — match their voice quality and structure exactly. Rosie and Elena are the gold standard.

## The object shape (every field required)
```js
{
  id: "kebab-id",                 // unique, lowercase; portrait path will be /media/<id>.jpg
  name: "Full Name",
  age: 0,
  crime: "The Title-Cased Hook",  // short, noir, intriguing
  tagline: "One-line teaser shown on the case card.",
  difficulty: "EASY" | "MEDIUM" | "HARD",
  color: "#hex",                  // accent; green-ish easy, amber medium, red hard
  budget: 6 | 8 | 10,             // EASY 6, MEDIUM 8, HARD 10
  startComposure: 40 | 65 | 90,   // EASY 40, MEDIUM 65, HARD 90
  initials: "FN",
  room: "WHERE IT HAPPENS, IN CAPS",
  portrait: "/media/<id>.jpg",
  briefing: [ /* exactly 4 evidence bullets the detective starts with */ ],
  intel: [ /* exactly 2 fragments; [0] unlocks at 66% composure, [1] at 33% — each nudges toward the truth WITHOUT naming it */ ],
  opening: "The suspect's first defiant line.",
  starters: [ /* exactly 3 starter questions, 3 DIFFERENT tactics from PRESSURE|EMPATHY|LOGIC|BLUFF */
    { tactic: "LOGIC", q: "..." }, { tactic: "EMPATHY", q: "..." }, { tactic: "BLUFF", q: "..." }
  ],
  persona: "2nd-person system prompt. MUST contain: 'THE HIDDEN TRUTH:' (sympathetic or surprising — see tone), 3-4 explicit PRESSURE POINTS that rattle them, 1 explicit RESISTANCE (a tactic that barely works / makes them stonewall), and concrete VOICE notes (cadence, verbal tics). Tell them to never reveal the truth before breaking.",
  theories: [ /* exactly 4; exactly ONE correct:true; the other 3 are PLAUSIBLE distractors, not obvious throwaways */
    { label: "...", correct: false }, { label: "...", correct: true }, ...
  ],
  reveal: "2-4 sentences. The declassified truth. MUST recontextualize at least one briefing fact.",
  confession: "The breaking-point confession in the suspect's own voice, several sentences. This is the payoff when cracked — make it land emotionally."
}
```

## Hard requirements (a case is rejected if it misses these)
1. **Exactly one** `correct: true` theory.
2. **Not guessable from the briefing alone.** A player who reads the brief and guesses must be at ~25%, not obvious. The correct theory becomes findable only by interrogating / using intel. Distractors must be genuinely tempting.
3. **BLUFF is first-class.** At least one starter or pressure point must reward a *bluff that fits the facts* (e.g., "your partner already told us everything"), and the persona must say how the suspect reacts to a bluff (folds if it fits, scoffs if it doesn't).
4. **Pressure points are specific and evidence-anchored** — tied to the briefing/intel, so a sharp question lands hard and a vague one doesn't.
5. **Tuned to the difficulty engine:** composure drops by severity — 9 (solid) / 16 (well-aimed) / 26 (precise pressure-point or fitting bluff). So EASY (40c/6q) should crack in ~3 good hits; HARD (90c/10q) needs ~4 precise strikes and rewards an accusation if not cracked.
6. **Voice must be distinct and consistent** — as different from the other suspects as Lucas is from Elena.

## Tone (from SPEC.md)
Hidden truths should have a human twist (protecting someone, misguided love, pride, fear). Pure villainy only at HARD. Comedy and local-flavor cases are first-class, not gimmicks. The reveal must recontextualize a briefing fact.

## Output
Return ONLY a fenced ```js block containing your case object(s) as valid JS object
literal(s) (comma-separated if more than one), ready to paste into the `CASES` array.
No prose before or after. Keys in the same order as the shape above.
