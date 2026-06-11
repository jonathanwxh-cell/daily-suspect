# Casefile Mode — Play Kit (Season: "A Death at Holloway House")

**Casefile** is the long-form mode of *Daily Suspect*: one closed-circle murder, a cast of suspects,
solved over a long sitting by **interrogation → cross-examination → deduction**. You play a detective.
Cornelius Vane is dead in his locked study; five people were snowed/flooded in with him; one is the killer.

## The loop
1. **Interrogate** suspects about their **topics** (each suspect has a few). A sharp, specific,
   evidence-anchored question presses a topic and lowers its resistance; press a topic to **0** and it
   **breaks**, dropping a **clue** into your **Case File**.
2. Some topics (the guilty party's) **resist questioning** — you can't break them by talk. You must
   **Present** a clue you've already found to that suspect to shatter their story (a contradiction).
3. Keep gathering clues. The **Deduction Board** has 3 questions — **Who / How / Why**. To **lock** each,
   you name the answer **and** select the Case-File clues that prove it. You can only lock what your
   evidence supports.
4. When all 3 are locked, **accuse**. Solve it and you get the truth + a rank (fewer questions = better).

## API (base: http://127.0.0.1:4217) — paste this PowerShell helper block once
```powershell
[Console]::OutputEncoding=[System.Text.Encoding]::UTF8  # render the suspects' em-dashes/quotes correctly
$global:B="http://127.0.0.1:4217"; $global:SID=$null
function Case(){ (Invoke-RestMethod "$B/api/season/case?id=holloway").case }
function Begin(){ $r=Invoke-RestMethod -Method Post "$B/api/season/start" -ContentType application/json -Body '{"seasonId":"holloway"}'; $global:SID=$r.sessionId; "BRIEFING:"; $r.case.briefing|%{"  - "+$_}; ""; "SUSPECTS:"; $r.case.suspects|%{"  "+$_.id+" ("+$_.role+") — "+$_.blurb} }
function Topics($sid){ ((Invoke-RestMethod "$B/api/season/case?id=holloway").case.suspects|?{$_.id -eq $sid}).threads | %{ "  "+$_.id+" — "+$_.hint } }
function File(){ (Invoke-RestMethod -Method Post "$B/api/season/state" -ContentType application/json -Body (@{sessionId=$SID}|ConvertTo-Json)).state.caseFile | %{ $_.id+": "+$_.title } }
function Ask($who,$q){ $r=Invoke-RestMethod -Method Post "$B/api/season/interrogate" -ContentType application/json -Body (@{sessionId=$SID;suspectId=$who;question=$q}|ConvertTo-Json); ($who.ToUpper())+": "+$r.reply; "  [topic=$($r.thread) hit=$($r.delta) resistance=$($r.composure) broke=$($r.broke)]"; if($r.unlocked){"  >>> NEW CLUE: "+(($r.unlocked|%{$_.title}) -join '; ')}; if($r.episodeAdvanced){"  >>> EPISODE: "+$r.episodeAdvanced.title} }
function Present($who,$clueId){ $r=Invoke-RestMethod -Method Post "$B/api/season/present" -ContentType application/json -Body (@{sessionId=$SID;suspectId=$who;clueId=$clueId}|ConvertTo-Json); ($who.ToUpper())+" (shown $clueId): "+$r.reply; "  [implicated=$($r.implicated) broke=$($r.broke)]"; if($r.unlocked){"  >>> NEW CLUE: "+(($r.unlocked|%{$_.title}) -join '; ')} }
function BoardQs(){ (Invoke-RestMethod "$B/api/season/case?id=holloway").case.board.questions | %{ $_.id+" ("+$_.kind+"): "+$_.prompt } }
function Lock($qid,$answer,[string[]]$clues){ $r=Invoke-RestMethod -Method Post "$B/api/season/board" -ContentType application/json -Body (@{sessionId=$SID;questionId=$qid;answer=$answer;clues=$clues}|ConvertTo-Json); "LOCK $qid = $answer : accepted=$($r.accepted) ($($r.reason))" }
function Accuse(){ Invoke-RestMethod -Method Post "$B/api/season/accuse" -ContentType application/json -Body (@{sessionId=$SID}|ConvertTo-Json) | ConvertTo-Json -Depth 6 }
```
Usage:
```powershell
Begin
Topics shaw            # see a suspect's topics + hints
Ask shaw "You signed it off as a heart attack in under an hour — did you run a tox screen?"
File                   # see clues you've collected (use their ids)
Present margaret "tox_report"   # show a found clue to a suspect to break a resistant topic
BoardQs
Lock "who" "shaw" @("margaret_saw_shaw","med_log","shaw_unravels")
Accuse
```
- `answer` for the **who** question is a **suspect id**; for **how/why** it's a **clue id**. `clues` are the
  clue ids that prove it. If a lock is rejected, the reason tells you what's missing.
- If a call errors, wait 2-3s and retry (shared model backend). Backend slowness in this harness is NOT
  part of any rating.

## Screenshots to view (use the Read tool) — the mode's look, mobile-first
- Case cover / briefing:  C:\Users\Greyf\Desktop\Claude Code\cf-01-cover.jpeg
- Suspect roster (portraits): C:\Users\Greyf\Desktop\Claude Code\cf-04-roster-portraits.jpeg
- Interrogation room (topic chips + reaction feedback): C:\Users\Greyf\Desktop\Claude Code\cf-03-room.jpeg

## What to weigh
Is it **fun and interesting**? Judge: the hook and atmosphere, the interrogation writing & suspect voices,
the cross-examination "present the contradiction" move, the deduction (figuring out who/how/why), fairness
and clarity, the payoff of solving it, and whether you'd want to play another season.

## Output — return ONLY this JSON, nothing else
```json
{
  "juror": "<your name>",
  "rating": <integer 1-10>,
  "verdict": "<one punchy sentence>",
  "solved": <true|false>,
  "strengths": ["...", "...", "..."],
  "problems": ["...", "...", "..."],
  "wouldPlayAnotherSeason": <true|false>,
  "mustFixToReach8": ["<concrete change>", "..."]
}
```
