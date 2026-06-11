// Consistency validator for Casefile seasons. Proves a season is watertight + solvable BEFORE it ships:
// no dangling clue/suspect/thread references, and every board-answer's supporting clue is reachable
// from the start via a real chain of thread-breaks and evidence-presentations.
//
// A thread is "breakable by questioning" if its startComposure is low enough to wear down (<= 60).
// A higher thread only breaks when a reachable clue is PRESENTED to it (a contradiction). So reachability
// is the fixpoint of: start clues -> break the threads you can -> their unlocked clues let you present
// more contradictions -> break more threads, until nothing new opens.

const QUESTIONABLE_MAX = 60;

export function validateSeason(season) {
  const errors = [];
  const clueIds = new Set(season.clues.map((c) => c.id));
  const suspectIds = new Set(season.suspects.map((s) => s.id));
  const threadIds = new Set();
  for (const s of season.suspects) for (const t of s.threads) threadIds.add(`${s.id}.${t.id}`);

  const ref = (cond, msg) => { if (!cond) errors.push(msg); };

  // 1. Structural references.
  for (const s of season.suspects) {
    for (const t of s.threads) {
      for (const u of t.unlocks || []) ref(clueIds.has(u), `thread ${s.id}.${t.id} unlocks missing clue '${u}'`);
      ref(typeof t.startComposure === "number" && t.startComposure > 0, `thread ${s.id}.${t.id} bad startComposure`);
    }
  }
  for (const c of season.contradictions) {
    ref(clueIds.has(c.clueId), `contradiction references missing clue '${c.clueId}'`);
    ref(suspectIds.has(c.suspectId), `contradiction references missing suspect '${c.suspectId}'`);
    ref(threadIds.has(`${c.suspectId}.${c.threadId}`), `contradiction references missing thread '${c.suspectId}.${c.threadId}'`);
  }
  ref(suspectIds.has(season.solution.killer), `solution.killer '${season.solution.killer}' is not a suspect`);
  for (const q of season.board.questions) {
    if (q.kind === "suspect") ref(suspectIds.has(q.correct), `board '${q.id}' correct '${q.correct}' is not a suspect`);
    if (q.kind === "clue") ref(clueIds.has(q.correct), `board '${q.id}' correct '${q.correct}' is not a clue`);
    for (const sup of q.support) ref(clueIds.has(sup), `board '${q.id}' support missing clue '${sup}'`);
  }
  for (const e of season.episodes) {
    if (e.unlock?.clue) ref(clueIds.has(e.unlock.clue), `episode '${e.id}' gate references missing clue '${e.unlock.clue}'`);
  }

  // 2. Reachability fixpoint.
  const reachable = new Set(season.clues.filter((c) => c.start).map((c) => c.id));
  const brokenThreads = new Set();
  let changed = true;
  while (changed) {
    changed = false;
    for (const s of season.suspects) {
      for (const t of s.threads) {
        const key = `${s.id}.${t.id}`;
        if (brokenThreads.has(key)) continue;
        const byQuestion = !t.presentOnly && t.startComposure <= QUESTIONABLE_MAX;
        const byPresent = season.contradictions.some(
          (c) => c.suspectId === s.id && c.threadId === t.id && reachable.has(c.clueId)
        );
        if (byQuestion || byPresent) {
          brokenThreads.add(key);
          changed = true;
          for (const u of t.unlocks || []) { if (!reachable.has(u)) { reachable.add(u); changed = true; } }
        }
      }
    }
  }

  // 3. Every board-answer's support must be reachable, and every episode gate must be reachable.
  for (const q of season.board.questions) {
    for (const sup of q.support) {
      if (!reachable.has(sup)) errors.push(`UNSOLVABLE: board '${q.id}' needs clue '${sup}', which can never be unlocked`);
    }
  }
  for (const e of season.episodes) {
    if (e.unlock?.clue && !reachable.has(e.unlock.clue)) {
      errors.push(`UNREACHABLE: episode '${e.id}' gate clue '${e.unlock.clue}' can never be unlocked`);
    }
  }

  return { ok: errors.length === 0, errors, reachableClues: [...reachable] };
}
