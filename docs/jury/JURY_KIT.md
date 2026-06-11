# Daily Suspect — Jury Kit

You are a playtester on a 5-person jury. **Daily Suspect** is a mobile-first AI
interrogation game: one AI suspect, a capped number of questions, one hidden truth.
Tap tactic chips (PRESSURE / EMPATHY / LOGIC / BLUFF) or type your own questions to
drop the suspect's composure to zero (confession) — or run out of questions and stake
an accusation on one of 4 theories.

Your job: **actually play it**, look at the screenshots, and rate it like the specific
person you are. Be honest and specific. 8/10 means genuinely good — something you'd
recommend — not merely "fine."

## The build under test
- Frontend (look + UX, mobile-first @ ~390px): http://127.0.0.1:3001
- Backend API (this is how you PLAY in this harness): http://127.0.0.1:4217

The core loop is text, so you can genuinely play through the API. Do that.

## How to play (PowerShell — paste this block once, then call the functions)
```powershell
$global:B="http://127.0.0.1:4217"
function Cases(){ (Invoke-RestMethod "$B/api/cases").cases | %{ "$($_.id): $($_.crime) [$($_.difficulty)] budget=$($_.budget) startComposure=$($_.startComposure) theories=$($_.theories.Count)" } }
function NewCase($id){ $s=Invoke-RestMethod -Method Post "$B/api/session" -ContentType application/json -Body (@{caseId=$id}|ConvertTo-Json); $global:SID=$s.sessionId; "OPENING: "+$s.transcript[0].text }
function Ask($q){ $r=Invoke-RestMethod -Method Post "$B/api/interrogate" -ContentType application/json -Body (@{sessionId=$SID;question=$q}|ConvertTo-Json); "SUSPECT: "+$r.reply; "  [delta=$($r.delta) | read: $($r.read) | composure=$($r.composure) | left=$($r.questionsRemaining) | cracked=$($r.cracked)]"; if($r.intel){"  INTEL UNLOCKED: "+$r.intel}; "  suggested next: "+(($r.suggested|%{$_.tactic+'> '+$_.q}) -join '  |  ') }
function Accuse($i){ Invoke-RestMethod -Method Post "$B/api/accuse" -ContentType application/json -Body (@{sessionId=$SID;theoryIndex=$i}|ConvertTo-Json) | ConvertTo-Json -Depth 6 }
function Theories($id){ ((Invoke-RestMethod "$B/api/cases").cases | ?{$_.id -eq $id}).theories | %{ $i=0 } { "$i = $_"; $i++ } }
```
Example session:
```powershell
Cases
NewCase lucas
Ask "How did chocolate frosting get on your cheek if you were in your room?"
Ask "Is Biscuit feeling okay? You keep looking at his bed."
# ...keep asking your own questions until cracked, or out of budget...
Theories lucas        # see the 4 theories with their indexes
Accuse 1              # stake theory #1  (use -1 only if already cracked)
```
- Cases available (7): `lucas` (EASY), `marcus-fridge` (EASY, office comedy), `rosie` (MEDIUM, Singlish), `the-date` (MEDIUM), `salieri` (MEDIUM, history), `elena` (HARD), `voight-kampff` (HARD, sci-fi). Try a mix.
- Tactics now include first-class BLUFF — a bluff that FITS the evidence lands hard; one that doesn't gets scoffed off.
- If an API call errors, wait 2-3 seconds and retry (shared model backend).
- **Play at least 2 cases** of different difficulty, asking YOUR OWN questions in
  character. Notice: does hitting the obvious weak point feel rewarding? Is it too
  easy / too hard / swingy? Could you "win" by guessing without playing? Would you
  come back tomorrow?

## Screenshots to view (use the Read tool on each) — current build, mobile-first
- Case board / landing (all 7 cases): C:\Users\Greyf\Desktop\Claude Code\ds-v2-03-mobile-landing.jpeg
- Interrogation room (case file + suspect portrait + tactic chips + accuse): C:\Users\Greyf\Desktop\Claude Code\ds-v2-04-room-portrait.jpeg
- Verdict + shareable result card: C:\Users\Greyf\Desktop\Claude Code\ds-v2-02-verdict.jpeg

(The game is **mobile-first** — weight the mobile screenshots as the primary experience.
Audio is procedural SFX + a noir music track, both toggled in the header; you can't hear
them in this harness, so judge audio only by concept, not execution.)

## What to weigh
Difficulty (fair? satisfying? exploitable?), pacing / attention hook (does it grab fast?),
writing & characters, fun, replayability (would you return / share?), UX & visual polish.

## Output — return ONLY this JSON, nothing else
```json
{
  "juror": "<your name>",
  "rating": <integer 1-10>,
  "verdict": "<one punchy sentence>",
  "strengths": ["...", "...", "..."],
  "problems": ["...", "...", "..."],
  "wouldReplayTomorrow": <true|false>,
  "difficultyNotes": "<too easy/hard/swingy/fair + why>",
  "replayabilityNotes": "<what would make you come back>",
  "mustFixToReach8": ["<concrete change>", "..."]
}
```
