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

  it("requires a server-created session before revealing a verdict", async () => {
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

    const created = await json(
      await app.handle(
        request("/api/session", {
          method: "POST",
          body: JSON.stringify({ caseId: "lucas" }),
        })
      )
    );
    assert.equal(created.status, 200);
    assert.match(created.body.sessionId, /^[a-f0-9-]{36}$/);

    const verdict = await json(
      await app.handle(
        request("/api/accuse", {
          method: "POST",
          body: JSON.stringify({ sessionId: created.body.sessionId, theoryIndex: 1 }),
        })
      )
    );
    assert.equal(verdict.status, 200);
    assert.equal(verdict.body.correct, true);
    assert.match(verdict.body.reveal, /Biscuit/);
  });

  it("uses server-owned session state for interrogation turns", async () => {
    const store = createMemoryStore();
    const prompts = [];
    const app = createApp({
      store,
      model: {
        complete: async (prompt) => {
          prompts.push(prompt);
          return JSON.stringify({
            reply: "I only wanted Biscuit to have some.",
            composureDelta: -12,
            suggested: [
              { tactic: "EMPATHY", q: "Is Biscuit feeling sick?" },
              { tactic: "LOGIC", q: "How did cake reach your room?" },
              { tactic: "PRESSURE", q: "What would Chloe say?" },
            ],
          });
        },
      },
    });

    const created = await json(
      await app.handle(
        request("/api/session", {
          method: "POST",
          body: JSON.stringify({ caseId: "lucas" }),
        })
      )
    );

    const turn = await json(
      await app.handle(
        request("/api/interrogate", {
          method: "POST",
          body: JSON.stringify({
            sessionId: created.body.sessionId,
            question: "Why is there frosting on your cheek?",
          }),
        })
      )
    );

    assert.equal(turn.status, 200);
    assert.equal(turn.body.delta, -12);
    assert.equal(turn.body.composure, 28);
    assert.equal(turn.body.reply, "I only wanted Biscuit to have some.");
    assert.match(prompts[0], /THE DETECTIVE NOW ASKS/);

    const session = await store.getSession(created.body.sessionId);
    assert.equal(session.questionsUsed, 1);
    assert.equal(session.transcript.length, 3);
    assert.equal(session.transcript[1].text, "Why is there frosting on your cheek?");
  });
});
