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
function Ask($q){ $r=Invoke-RestMethod -Method Post "$B/api/interrogate" -ContentType application/json -Body (@{sessionId=$SID;question=$q}|ConvertTo-Json); "SUSPECT: "+$r.reply; "  [delta=$($r.delta) composure=$($r.composure) cracked=$($r.cracked)]"; if($r.intel){"  INTEL UNLOCKED: "+$r.intel}; "  suggested next: "+(($r.suggested|%{$_.tactic+'> '+$_.q}) -join '  |  ') }
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
- Cases available: `lucas` (EASY), `rosie` (MEDIUM, Singlish), `elena` (HARD).
- If an API call errors, wait 2-3 seconds and retry (shared model backend).
- **Play at least 2 cases** of different difficulty, asking YOUR OWN questions in
  character. Notice: does hitting the obvious weak point feel rewarding? Is it too
  easy / too hard / swingy? Could you "win" by guessing without playing? Would you
  come back tomorrow?

## Screenshots to view (use the Read tool on each)
- Desktop landing:  C:\Users\Greyf\Desktop\Claude Code\ds-base-01-landing.jpeg
- Case briefing:    C:\Users\Greyf\Desktop\Claude Code\ds-base-02-brief.jpeg
- Interrogation room (desktop): C:\Users\Greyf\Desktop\Claude Code\ds-base-03-room.jpeg
- Verdict screen:   C:\Users\Greyf\Desktop\Claude Code\ds-base-04-verdict.jpeg
- Mobile landing:   C:\Users\Greyf\Desktop\Claude Code\ds-base-05-mobile-landing.jpeg
- Mobile room:      C:\Users\Greyf\Desktop\Claude Code\ds-base-06-mobile-room.jpeg

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
