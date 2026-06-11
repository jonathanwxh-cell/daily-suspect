import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createApp } from "./app.mjs";
import { createMemoryStore } from "./stores.mjs";

async function json(res) {
  return {
    status: res.status,
    body: await res.json(),
  };
}

function request(path, init = {}) {
  return new Request(`http://daily-suspect.test${path}`, {
    headers: { "Content-Type": "application/json", ...(init.headers || {}) },
    ...init,
  });
}

// A model stub that returns a fixed severity + reply, in the JSON shape app.mjs parses.
function severityModel(severity, reply = "...") {
  return {
    complete: async () =>
      JSON.stringify({
        reply,
        severity,
        suggested: [
          { tactic: "EMPATHY", q: "Is Biscuit feeling sick?" },
          { tactic: "LOGIC", q: "How did cake reach your room?" },
          { tactic: "PRESSURE", q: "What would Chloe say?" },
        ],
      }),
  };
}

async function newSession(app, caseId = "lucas") {
  const created = await json(
    await app.handle(request("/api/session", { method: "POST", body: JSON.stringify({ caseId }) }))
  );
  return created.body.sessionId;
}

describe("Hetzner API contract", () => {
  it("serves public cases without hidden truth fields", async () => {
    const app = createApp({ store: createMemoryStore(), model: { complete: async () => "{}" } });

    const { status, body } = await json(await app.handle(request("/api/cases")));

    assert.equal(status, 200);
    assert.ok(body.cases.length >= 1);
    const first = body.cases[0];
    assert.equal(first.persona, undefined);
    assert.equal(first.reveal, undefined);
    assert.equal(first.confession, undefined);
    assert.equal(typeof first.theories[0], "string");
  });

  it("requires a server-created session before an accusation is scored", async () => {
    const app = createApp({ store: createMemoryStore(), model: { complete: async () => "{}" } });

    const blocked = await json(
      await app.handle(
        request("/api/accuse", {
          method: "POST",
          body: JSON.stringify({ sessionId: "missing", theoryIndex: 1 }),
        })
      )
    );
    assert.equal(blocked.status, 404);
    assert.equal(blocked.body.reveal, undefined);
  });

  it("does NOT reward a blind 0-question correct guess with the truth (hunch)", async () => {
    const app = createApp({ store: createMemoryStore(), model: { complete: async () => "{}" } });
    const sessionId = await newSession(app);

    const verdict = await json(
      await app.handle(
        request("/api/accuse", {
          method: "POST",
          body: JSON.stringify({ sessionId, theoryIndex: 1 }), // lucas index 1 = correct
        })
      )
    );
    assert.equal(verdict.status, 200);
    assert.equal(verdict.body.outcome, "HUNCH");
    assert.equal(verdict.body.correct, true);
    assert.equal(verdict.body.blindGuess, true);
    assert.equal(verdict.body.truthSealed, true);
    assert.ok(!verdict.body.reveal, "blind guess must not reveal the truth");
  });

  it("reveals the truth on a correct accusation only after real investigation", async () => {
    const app = createApp({ store: createMemoryStore(), model: severityModel(1, "I was in my room!") });
    const sessionId = await newSession(app);

    for (const q of ["Where were you?", "How did frosting get on your cheek?"]) {
      await app.handle(
        request("/api/interrogate", { method: "POST", body: JSON.stringify({ sessionId, question: q }) })
      );
    }

    const verdict = await json(
      await app.handle(
        request("/api/accuse", {
          method: "POST",
          body: JSON.stringify({ sessionId, theoryIndex: 1 }),
        })
      )
    );
    assert.equal(verdict.body.outcome, "CASE_CLOSED");
    assert.equal(verdict.body.correct, true);
    assert.equal(verdict.body.truthSealed, false);
    assert.match(verdict.body.reveal, /Biscuit/);
  });

  it("seals the truth on a wrong accusation so a loss never spoils or leaks the answer", async () => {
    const app = createApp({ store: createMemoryStore(), model: { complete: async () => "{}" } });
    const sessionId = await newSession(app);

    const verdict = await json(
      await app.handle(
        request("/api/accuse", {
          method: "POST",
          body: JSON.stringify({ sessionId, theoryIndex: 0 }), // lucas index 0 = wrong
        })
      )
    );
    assert.equal(verdict.body.outcome, "WALKED_FREE");
    assert.equal(verdict.body.correct, false);
    assert.equal(verdict.body.truthSealed, true);
    assert.ok(!verdict.body.reveal, "a wrong accusation must not reveal the truth");
  });

  it("maps model severity to a deterministic composure delta and owns session state", async () => {
    const store = createMemoryStore();
    const prompts = [];
    const app = createApp({
      store,
      model: {
        complete: async (prompt) => {
          prompts.push(prompt);
          return JSON.stringify({
            reply: "I only wanted Biscuit to have some.",
            severity: 2,
            suggested: [
              { tactic: "EMPATHY", q: "Is Biscuit feeling sick?" },
              { tactic: "LOGIC", q: "How did cake reach your room?" },
              { tactic: "PRESSURE", q: "What would Chloe say?" },
            ],
          });
        },
      },
    });

    const sessionId = await newSession(app);
    const turn = await json(
      await app.handle(
        request("/api/interrogate", {
          method: "POST",
          body: JSON.stringify({ sessionId, question: "Why is there frosting on your cheek?" }),
        })
      )
    );

    assert.equal(turn.status, 200);
    assert.equal(turn.body.delta, -16); // severity 2 -> -16
    assert.equal(turn.body.composure, 24); // lucas starts at 40
    assert.equal(turn.body.reply, "I only wanted Biscuit to have some.");
    assert.match(prompts[0], /THE DETECTIVE NOW ASKS/);
    assert.match(prompts[0], /severity/);

    const session = await store.getSession(sessionId);
    assert.equal(session.questionsUsed, 1);
    assert.equal(session.transcript.length, 3);
    assert.equal(session.transcript[1].text, "Why is there frosting on your cheek?");
  });
});
