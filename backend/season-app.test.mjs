import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createSeasonApp } from "./season-app.mjs";
import { createMemorySeasonStore } from "./season-store.mjs";
import { SEASONS } from "./seasons.mjs";
import { validateSeason } from "./season-validate.mjs";

function request(path, init = {}) {
  return new Request(`http://season.test${path}`, {
    method: init.method || "GET",
    headers: { "Content-Type": "application/json", ...(init.headers || {}) },
    body: init.body,
  });
}
async function jsonOf(res) {
  return { status: res.status, body: await res.json() };
}

// Controllable model stub: interrogate prompts get {reply,thread,severity}; present prompts get {reply}.
function makeStub() {
  const ctl = { thread: "none", severity: 0, reply: "..." };
  const model = {
    async complete(prompt) {
      if (prompt.includes("sets a piece of evidence")) return JSON.stringify({ reply: ctl.reply });
      return JSON.stringify({ reply: ctl.reply, thread: ctl.thread, severity: ctl.severity });
    },
  };
  return { ctl, model };
}

function app() {
  const { ctl, model } = makeStub();
  return { ctl, app: createSeasonApp({ store: createMemorySeasonStore(), model }) };
}

async function start(a) {
  const r = await jsonOf(await a.handle(request("/api/season/start", { method: "POST", body: JSON.stringify({ seasonId: "holloway" }) })));
  return r.body.sessionId;
}
async function interrogate(a, sid, suspectId, ctl, thread, severity) {
  ctl.thread = thread; ctl.severity = severity;
  return jsonOf(await a.handle(request("/api/season/interrogate", { method: "POST", body: JSON.stringify({ sessionId: sid, suspectId, question: "Tell me about it." }) })));
}
async function breakByQuestion(a, sid, suspectId, ctl, thread) {
  // Hit it with severity-3 strikes until it breaks (or 6 tries).
  let last;
  for (let i = 0; i < 6; i++) {
    last = await interrogate(a, sid, suspectId, ctl, thread, 3);
    if (last.body.broke) return last;
  }
  return last;
}
async function present(a, sid, suspectId, clueId) {
  return jsonOf(await a.handle(request("/api/season/present", { method: "POST", body: JSON.stringify({ sessionId: sid, suspectId, clueId }) })));
}
async function lock(a, sid, questionId, answer, clues) {
  return jsonOf(await a.handle(request("/api/season/board", { method: "POST", body: JSON.stringify({ sessionId: sid, questionId, answer, clues }) })));
}

describe("Casefile season — validator", () => {
  it("every authored season is structurally sound and solvable", () => {
    for (const s of SEASONS) {
      const { ok, errors } = validateSeason(s);
      assert.ok(ok, `season ${s.id} invalid:\n${errors.join("\n")}`);
    }
  });
});

describe("Casefile season — engine", () => {
  it("serves a public case with no hidden truth fields", async () => {
    const { app: a } = app();
    const { body } = await jsonOf(await a.handle(request("/api/season/case?id=holloway")));
    const sus = body.case.suspects.find((s) => s.id === "shaw");
    assert.equal(sus.persona, undefined);
    assert.equal(body.case.solution, undefined);
    assert.equal(sus.threads[0].truth, undefined);
    assert.equal(sus.threads[0].unlocks, undefined);
  });

  it("breaks a low thread by questioning and unlocks its clue + advances the episode", async () => {
    const { ctl, app: a } = app();
    const sid = await start(a);
    const r = await breakByQuestion(a, sid, "shaw", ctl, "diagnosis");
    assert.equal(r.body.broke, true);
    assert.ok(r.body.unlocked.some((c) => c.id === "tox_report"));
    assert.equal(r.body.state.caseFile.some((c) => c.id === "tox_report"), true);
    assert.equal(r.body.state.episode, 1); // ep2 gated on tox_report
  });

  it("a high thread resists questioning but breaks when the right clue is PRESENTED", async () => {
    const { ctl, app: a } = app();
    const sid = await start(a);
    // get the clues we need first
    await breakByQuestion(a, sid, "shaw", ctl, "diagnosis"); // tox_report
    await present(a, sid, "margaret", "tox_report");          // -> margaret_saw_shaw
    // questioning shaw.whereabouts (composure 100) should NOT break it
    const q = await interrogate(a, sid, "shaw", ctl, "whereabouts", 3);
    assert.equal(q.body.broke, false);
    // presenting the eyewitness clue DOES break it
    const p = await present(a, sid, "shaw", "margaret_saw_shaw");
    assert.equal(p.body.implicated, true);
    assert.equal(p.body.broke, true);
    assert.ok(p.body.unlocked.some((c) => c.id === "shaw_unravels"));
  });

  it("rejects a board lock without the supporting evidence, and a wrong answer", async () => {
    const { app: a } = app();
    const sid = await start(a);
    const noSupport = await lock(a, sid, "who", "shaw", []);
    assert.equal(noSupport.body.accepted, false);
    const blindAccuse = await jsonOf(await a.handle(request("/api/season/accuse", { method: "POST", body: JSON.stringify({ sessionId: sid }) })));
    assert.equal(blindAccuse.body.solved, false);
    assert.ok(blindAccuse.body.openQuestions.length === 3);
  });

  it("supports a full, fair solve to a SOLVED verdict naming the killer", async () => {
    const { ctl, app: a } = app();
    const sid = await start(a);
    await breakByQuestion(a, sid, "shaw", ctl, "diagnosis");     // tox_report -> ep2
    await present(a, sid, "margaret", "tox_report");             // margaret_saw_shaw -> ep3
    await breakByQuestion(a, sid, "thomas", ctl, "that_night");  // thomas_observation + med_log -> ep4
    await present(a, sid, "shaw", "margaret_saw_shaw");          // shaw_unravels
    await breakByQuestion(a, sid, "iris", ctl, "the_file");      // veridian_file

    const who = await lock(a, sid, "who", "shaw", ["margaret_saw_shaw", "med_log", "shaw_unravels"]);
    assert.equal(who.body.accepted, true, JSON.stringify(who.body));
    const how = await lock(a, sid, "how", "tox_report", ["tox_report", "med_log"]);
    assert.equal(how.body.accepted, true, JSON.stringify(how.body));
    const why = await lock(a, sid, "why", "veridian_file", ["veridian_file"]);
    assert.equal(why.body.accepted, true, JSON.stringify(why.body));

    const verdict = await jsonOf(await a.handle(request("/api/season/accuse", { method: "POST", body: JSON.stringify({ sessionId: sid }) })));
    assert.equal(verdict.body.solved, true);
    assert.equal(verdict.body.killer, "shaw");
    assert.match(verdict.body.reveal, /Shaw/);
    assert.ok(["S", "A", "B", "C"].includes(verdict.body.rank));
  });
});
