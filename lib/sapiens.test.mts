import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildSapiensChatRequest,
  extractSapiensMessageText,
} from "./sapiens.ts";

describe("Sapiens chat adapter", () => {
  it("builds a default Sapiens chat-completions request", () => {
    const req = buildSapiensChatRequest("Return JSON only", {
      apiKey: "test-key",
    });

    assert.equal(req.url, "https://apihub.agnes-ai.com/v1/chat/completions");
    assert.equal(req.headers.Authorization, "Bearer test-key");
    assert.equal(req.headers["Content-Type"], "application/json");
    assert.equal(req.body.model, "agnes-2.0-flash");
    assert.equal(req.body.max_tokens, 1000);
    assert.deepEqual(req.body.messages, [
      { role: "user", content: "Return JSON only" },
    ]);
  });

  it("accepts a custom base URL without duplicating the endpoint path", () => {
    const fromBase = buildSapiensChatRequest("hi", {
      apiKey: "test-key",
      baseUrl: "https://example.test/v1/",
      model: "custom-model",
    });
    const fromFullEndpoint = buildSapiensChatRequest("hi", {
      apiKey: "test-key",
      baseUrl: "https://example.test/v1/chat/completions",
      model: "custom-model",
    });

    assert.equal(fromBase.url, "https://example.test/v1/chat/completions");
    assert.equal(fromFullEndpoint.url, "https://example.test/v1/chat/completions");
    assert.equal(fromBase.body.model, "custom-model");
  });

  it("extracts text from an OpenAI-compatible Sapiens response", () => {
    const text = extractSapiensMessageText({
      choices: [
        {
          message: {
            content: "{\"reply\":\"fine\"}",
          },
        },
      ],
    });

    assert.equal(text, "{\"reply\":\"fine\"}");
  });
});
