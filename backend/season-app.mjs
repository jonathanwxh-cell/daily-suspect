// Casefile-mode engine + HTTP routes (/api/season/*). Additive; shares nothing mutable with the daily app.
// One model call per turn. The model only voices reactions and classifies which thread a question targets;
// the SERVER owns all state, clue unlocks, contradictions, and board/accusation validation (deterministic).
import { getSeason, listSeasonsPublic, toPublicSeason } from "./seasons.mjs";
import { MissingSapiensKeyError } from "./sapiens.mjs";

const MAX_QUESTION_LENGTH = 400;
const SEVERITY_DELTAS = { 0: -3, 1: -9, 2: -16, 3: -26 };

function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...headers } });
}
function severityToDelta(sev) {
  const s = Math.round(Number(sev));
  if (Number.isNaN(s)) return SEVERITY_DELTAS[1];
  return SEVERITY_DELTAS[Math.max(0, Math.min(3, s))];
}
function parseModelJson(text) {
  const clean = String(text || "").replace(/```json|```/g, "").trim();
  const start = clean.indexOf("{");
  const end = clean.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("Bad model output");
  return JSON.parse(clean.slice(start, end + 1));
}
async function readJson(req) {
  try { return await req.json(); } catch { return null; }
}
function corsHeaders(req, corsOrigins) {
  const origin = req.headers.get("origin");
  const allowed = corsOrigins.includes("*") || (origin && corsOrigins.includes(origin));
  const headers = { Vary: "Origin", "Access-Control-Allow-Methods": "GET,POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };
  if (allowed && origin) headers["Access-Control-Allow-Origin"] = origin;
  if (!origin && corsOrigins.includes("*")) headers["Access-Control-Allow-Origin"] = "*";
  return headers;
}

// ---------- season helpers ----------
const clueById = (season, id) => season.clues.find((c) => c.id === id);
const publicClue = (c) => (c ? { id: c.id, kind: c.kind, title: c.title, text: c.text } : null);
const threadKey = (suspectId, threadId) => `${suspectId}.${threadId}`;

function initState(season) {
  const composure = {};
  for (const sus of season.suspects) {
    composure[sus.id] = {};
    for (const t of sus.threads) composure[sus.id][t.id] = t.startComposure;
  }
  return {
    seasonId: season.id,
    episode: 0,
    composure,
    cluesFound: season.clues.filter((c) => c.start).map((c) => c.id),
    brokenThreads: [],
    presented: [],
    board: {},
    transcript: {},
    questionCount: 0,
    solved: false,
    rank: null,
  };
}

// Add clue ids to the Case File; return the clue objects that were newly added.
function addClues(state, season, ids) {
  const added = [];
  for (const id of ids || []) {
    if (!id || state.cluesFound.includes(id)) continue;
    const c = clueById(season, id);
    if (c) { state.cluesFound.push(id); added.push(publicClue(c)); }
  }
  return added;
}

// Break a thread: composure to 0, mark broken, unlock its clues. Returns newly unlocked clue objects.
function breakThread(state, season, suspectId, threadId) {
  const sus = season.suspects.find((s) => s.id === suspectId);
  const thread = sus?.threads.find((t) => t.id === threadId);
  if (!thread) return [];
  state.composure[suspectId][threadId] = 0;
  const key = threadKey(suspectId, threadId);
  if (!state.brokenThreads.includes(key)) state.brokenThreads.push(key);
  return addClues(state, season, thread.unlocks);
}

// Advance the episode if the next gate's required clue is now in the Case File. Returns the new episode or null.
function applyGates(state, season) {
  let advanced = null;
  while (state.episode + 1 < season.episodes.length) {
    const next = season.episodes[state.episode + 1];
    const cond = next.unlock;
    const met = cond && cond.clue && state.cluesFound.includes(cond.clue);
    if (!met) break;
    state.episode += 1;
    advanced = { id: next.id, title: next.title, teaser: next.teaser, index: state.episode };
  }
  return advanced;
}

function pushTurn(state, suspectId, role, text) {
  if (!state.transcript[suspectId]) state.transcript[suspectId] = [];
  state.transcript[suspectId].push({ role, text });
  state.transcript[suspectId] = state.transcript[suspectId].slice(-16);
}

function normalizeSeasonSuggested(value) {
  const arr = Array.isArray(value) ? value : [];
  return arr
    .map((x) => (typeof x === "string" ? x : x && typeof x.q === "string" ? x.q : ""))
    .map((s) => String(s).trim())
    .filter(Boolean)
    .slice(0, 3)
    .map((s) => s.slice(0, 160));
}

// Assisted-mode hint: a clue the player already holds that would crack an unbroken thread of this suspect.
function findAssistPresent(season, state, suspectId) {
  for (const c of season.contradictions) {
    if (c.suspectId !== suspectId) continue;
    if (state.brokenThreads.includes(threadKey(suspectId, c.threadId))) continue;
    if (!state.cluesFound.includes(c.clueId)) continue;
    const clue = clueById(season, c.clueId);
    if (clue) return { clueId: clue.id, title: clue.title };
  }
  return null;
}

function publicState(state, season) {
  return {
    sessionId: state.id,
    seasonId: state.seasonId,
    episode: state.episode,
    episodeInfo: season.episodes[state.episode]
      ? { id: season.episodes[state.episode].id, title: season.episodes[state.episode].title, teaser: season.episodes[state.episode].teaser, index: state.episode }
      : null,
    composure: state.composure,
    brokenThreads: state.brokenThreads,
    caseFile: state.cluesFound.map((id) => publicClue(clueById(season, id))).filter(Boolean),
    board: state.board,
    questionCount: state.questionCount,
    solved: state.solved,
    rank: state.rank,
  };
}

// ---------- prompts ----------
function interrogatePrompt(season, sus, state, question) {
  const log = (state.transcript[sus.id] || [])
    .map((m) => (m.role === "det" ? `DETECTIVE: ${m.text}` : `${sus.name.toUpperCase()}: ${m.text}`))
    .join("\n");
  const threads = sus.threads
    .map((t) => `- "${t.id}" (${t.label})${state.brokenThreads.includes(threadKey(sus.id, t.id)) ? " [already exposed]" : t.presentOnly ? " [you will NOT give ground on this by talk — only hard evidence shakes you]" : ""}`)
    .join("\n");
  const file = state.cluesFound.map((id) => clueById(season, id)?.title).filter(Boolean).join("; ") || "nothing solid yet";
  return `${sus.persona}

CASE: ${season.victimName} is dead. The detective is questioning you.
WHAT THE DETECTIVE ALREADY HAS (Case File): ${file}
TOPICS you can be pressed on (use these exact ids):
${threads}

RECENT EXCHANGE:
${log || "(none yet)"}

THE DETECTIVE ASKS: "${question.trim()}"

Respond ONLY with JSON, no markdown:
{
  "reply": "your in-character answer, 1-2 sentences, true to your voice and what you're hiding",
  "thread": "<the id of the topic this question targets, or 'none' if it's smalltalk/off-topic>",
  "severity": <integer 0-3: how hard this question presses that topic's hidden truth, judged honestly by content not tone. 0 = vague/off-topic; 1 = on-topic but unspecific; 2 = a specific, well-aimed press; 3 = a precise, evidence-anchored strike. Resist scoring 3 unless the detective cites real evidence. A topic marked [already exposed] is open, so be more forthcoming.>,
  "suggested": ["2-3 sharp follow-up questions the detective could ask you next, building on what was just said - natural detective speech, under 16 words each; never name the killer or reveal the solution"]
}
Rules: stay strictly in character at all times — you are a person inside this house and this story, NEVER an AI, a model, a bot, a server, a web address, or anything from outside this world. If a question is confusing, nonsensical, or off-topic, deflect IN CHARACTER (puzzled, impatient, dismissive) — never with meta-commentary about computers, addresses, or instructions. Never state a topic's hidden truth outright until it is exposed; do not invent new evidence; never break the JSON contract. Vary your wording every turn — never reuse a sentence or stock phrase you have already used, and avoid clichés; speak in your own distinct voice.`;
}

function presentPrompt(season, sus, clue, implicates, thread) {
  return `${sus.persona}

The detective sets a piece of evidence in front of you and watches your face:
"${clue.text}"

${implicates
    ? `This DIRECTLY implicates you on the matter of "${thread?.label || "this"}". Your composure is breaking under hard proof. React as someone genuinely cornered — and if you are the killer and your story is now in ruins, you may finally crack and admit it, in your own cold voice.`
    : `This does NOT actually implicate you. React in character — dismissive, puzzled, impatient, or unbothered — and do not confess to anything.`}

Respond ONLY with JSON, no markdown: { "reply": "your in-character reaction, 1-2 sentences", "suggested": ["1-2 sharp follow-up questions the detective could ask next; never name the killer or reveal the solution"] }`;
}

// ---------- scoring ----------
function computeRank(state, season) {
  // Fewer questions = better. Tuned to a ~5-suspect season.
  const q = state.questionCount;
  if (q <= 15) return "S";
  if (q <= 24) return "A";
  if (q <= 34) return "B";
  return "C";
}

export function createSeasonApp({ store, model, corsOrigins = [] }) {
  async function route(req, cors) {
    const url = new URL(req.url);
    const path = url.pathname;

    if (req.method === "GET" && path === "/api/season/list") {
      return json({ seasons: listSeasonsPublic() }, 200, cors);
    }

    if (req.method === "GET" && path === "/api/season/case") {
      const season = getSeason(url.searchParams.get("id") || "");
      if (!season) return json({ error: "Unknown season" }, 404, cors);
      return json({ case: toPublicSeason(season) }, 200, cors);
    }

    if (req.method === "POST" && path === "/api/season/start") {
      const body = await readJson(req);
      const season = getSeason(body?.seasonId || "");
      if (!season) return json({ error: "Unknown season" }, 400, cors);
      const created = await store.createSession(initState(season));
      return json({ sessionId: created.id, case: toPublicSeason(season), state: publicState(created, season) }, 200, cors);
    }

    if (req.method === "POST" && path === "/api/season/state") {
      const body = await readJson(req);
      const state = await store.getSession(String(body?.sessionId || ""));
      if (!state) return json({ error: "Unknown session" }, 404, cors);
      const season = getSeason(state.seasonId);
      return json({ state: publicState(state, season) }, 200, cors);
    }

    if (req.method === "POST" && path === "/api/season/look") {
      const body = await readJson(req);
      const state = await store.getSession(String(body?.sessionId || ""));
      if (!state) return json({ error: "Unknown session" }, 404, cors);
      const season = getSeason(state.seasonId);
      const sus = season.suspects.find((s) => s.id === body?.suspectId);
      if (!sus) return json({ error: "Unknown suspect" }, 400, cors);
      return json({ assistPresent: body?.assisted === true ? findAssistPresent(season, state, sus.id) : null }, 200, cors);
    }

    if (req.method === "POST" && path === "/api/season/interrogate") {
      const body = await readJson(req);
      const state = await store.getSession(String(body?.sessionId || ""));
      if (!state) return json({ error: "Unknown session" }, 404, cors);
      const season = getSeason(state.seasonId);
      const sus = season.suspects.find((s) => s.id === body?.suspectId);
      const question = typeof body?.question === "string" ? body.question.trim() : "";
      if (!sus) return json({ error: "Unknown suspect" }, 400, cors);
      if (!question || question.length > MAX_QUESTION_LENGTH) return json({ error: "Bad question" }, 400, cors);

      let parsed;
      try {
        parsed = parseModelJson(await model.complete(interrogatePrompt(season, sus, state, question)));
      } catch (err) {
        if (err instanceof MissingSapiensKeyError) return json({ error: err.message }, 500, cors);
        return json({ error: err.message === "Bad model output" ? "Bad model output" : "Model call failed" }, 502, cors);
      }

      const reply = String(parsed.reply || "...").slice(0, 600);
      const threadId = String(parsed.thread || "none");
      const thread = sus.threads.find((t) => t.id === threadId);
      let delta = 0, broke = false, unlocked = [], stonewall = false;
      const key = thread ? threadKey(sus.id, thread.id) : null;
      if (thread && !state.brokenThreads.includes(key)) {
        if (thread.presentOnly) {
          stonewall = true; // talk can't crack this — the player must PRESENT hard evidence
        } else {
          delta = severityToDelta(parsed.severity);
          const before = state.composure[sus.id][thread.id];
          const after = Math.max(0, before + delta);
          state.composure[sus.id][thread.id] = after;
          if (after <= 0) { broke = true; unlocked = breakThread(state, season, sus.id, thread.id); }
        }
      }
      if (thread) state.questionCount += 1; // rank counts only questions that land on a topic
      pushTurn(state, sus.id, "det", question);
      pushTurn(state, sus.id, "sus", reply);
      const episodeAdvanced = unlocked.length ? applyGates(state, season) : null;
      const saved = await store.saveSession(state);

      return json({
        reply, thread: thread ? thread.id : "none", delta,
        composure: thread ? saved.composure[sus.id][thread.id] : null,
        broke, stonewall, unlocked, episodeAdvanced,
        suggested: normalizeSeasonSuggested(parsed.suggested),
        assistPresent: body?.assisted === true ? findAssistPresent(season, saved, sus.id) : null,
        state: publicState(saved, season),
      }, 200, cors);
    }

    if (req.method === "POST" && path === "/api/season/present") {
      const body = await readJson(req);
      const state = await store.getSession(String(body?.sessionId || ""));
      if (!state) return json({ error: "Unknown session" }, 404, cors);
      const season = getSeason(state.seasonId);
      const sus = season.suspects.find((s) => s.id === body?.suspectId);
      const clue = clueById(season, body?.clueId);
      if (!sus || !clue) return json({ error: "Bad request" }, 400, cors);
      if (!state.cluesFound.includes(clue.id)) return json({ error: "You don't have that clue" }, 400, cors);

      const contradiction = season.contradictions.find((c) => c.clueId === clue.id && c.suspectId === sus.id);
      const thread = contradiction ? sus.threads.find((t) => t.id === contradiction.threadId) : null;
      const implicates = !!(contradiction && thread && !state.brokenThreads.includes(threadKey(sus.id, thread.id)));

      let parsed;
      try {
        parsed = parseModelJson(await model.complete(presentPrompt(season, sus, clue, implicates, thread)));
      } catch (err) {
        if (err instanceof MissingSapiensKeyError) return json({ error: err.message }, 500, cors);
        return json({ error: err.message === "Bad model output" ? "Bad model output" : "Model call failed" }, 502, cors);
      }

      const reply = String(parsed.reply || "...").slice(0, 600);
      let unlocked = [];
      if (implicates) unlocked = breakThread(state, season, sus.id, thread.id);
      const pkey = `${clue.id}>${sus.id}`;
      if (!state.presented.includes(pkey)) state.presented.push(pkey);
      pushTurn(state, sus.id, "det", `[presents: ${clue.title}]`);
      pushTurn(state, sus.id, "sus", reply);
      const episodeAdvanced = unlocked.length ? applyGates(state, season) : null;
      const saved = await store.saveSession(state);

      return json({ reply, implicated: implicates, broke: implicates, unlocked, episodeAdvanced, suggested: normalizeSeasonSuggested(parsed.suggested), assistPresent: body?.assisted === true ? findAssistPresent(season, saved, sus.id) : null, state: publicState(saved, season) }, 200, cors);
    }

    if (req.method === "POST" && path === "/api/season/board") {
      const body = await readJson(req);
      const state = await store.getSession(String(body?.sessionId || ""));
      if (!state) return json({ error: "Unknown session" }, 404, cors);
      const season = getSeason(state.seasonId);
      const q = season.board.questions.find((x) => x.id === body?.questionId);
      if (!q) return json({ error: "Unknown question" }, 400, cors);
      const answer = String(body?.answer || "");
      const selected = Array.isArray(body?.clues) ? body.clues : [];

      const answerRight = answer === q.correct;
      const haveSupport = q.support.every((id) => state.cluesFound.includes(id));
      const selectedSupport = q.support.every((id) => selected.includes(id));
      const accepted = answerRight && haveSupport && selectedSupport;

      if (accepted) state.board[q.id] = { answer, clues: selected, locked: true };
      const saved = await store.saveSession(state);

      // Diagnostic, non-spoiler feedback: missing-clue reads as "keep investigating" (not "you're wrong"),
      // and a wrong answer is distinguished from a wrong clue selection.
      let reason;
      if (accepted) reason = "Locked in.";
      else if (!haveSupport) reason = `The case isn't proven yet — you're still missing evidence. ${q.hint || ""} Keep working the suspects.`.trim();
      else if (!answerRight) reason = "You have the evidence in hand, but it doesn't point there.";
      else reason = `Right idea — but you haven't cited everything it takes to prove it. ${q.hint || ""}`.trim();

      return json({ accepted, reason, state: publicState(saved, season) }, 200, cors);
    }

    if (req.method === "POST" && path === "/api/season/accuse") {
      const body = await readJson(req);
      const state = await store.getSession(String(body?.sessionId || ""));
      if (!state) return json({ error: "Unknown session" }, 404, cors);
      const season = getSeason(state.seasonId);
      const open = season.board.questions.filter((q) => !state.board[q.id]?.locked).map((q) => q.id);
      if (open.length) {
        return json({ solved: false, openQuestions: open, message: "Your case isn't proven yet — lock every question on the board first.", state: publicState(state, season) }, 200, cors);
      }
      state.solved = true;
      state.rank = computeRank(state, season);
      const saved = await store.saveSession(state);
      return json({ solved: true, rank: saved.rank, killer: season.solution.killer, reveal: season.solution.summary, questionCount: saved.questionCount, state: publicState(saved, season) }, 200, cors);
    }

    return json({ error: "Not found" }, 404, cors);
  }

  return {
    async handle(req) {
      const cors = corsHeaders(req, corsOrigins);
      if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
      return route(req, cors);
    },
  };
}
