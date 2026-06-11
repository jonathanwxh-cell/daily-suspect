export const DEFAULT_SAPIENS_BASE_URL = "https://apihub.agnes-ai.com/v1";
export const DEFAULT_SAPIENS_MODEL = "agnes-2.0-flash";

export class MissingSapiensKeyError extends Error {
  constructor() {
    super("SAPIENS_API_KEY is not configured on the server.");
    this.name = "MissingSapiensKeyError";
  }
}

function toChatCompletionsUrl(baseUrl) {
  const normalized = (baseUrl || DEFAULT_SAPIENS_BASE_URL).trim().replace(/\/+$/, "");
  if (normalized.endsWith("/chat/completions")) return normalized;
  return `${normalized}/chat/completions`;
}

export function buildSapiensChatRequest(prompt, config) {
  return {
    url: toChatCompletionsUrl(config.baseUrl),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: {
      model: config.model?.trim() || DEFAULT_SAPIENS_MODEL,
      max_tokens: config.maxTokens || 1000,
      temperature: config.temperature ?? 0.2,
      messages: [{ role: "user", content: prompt }],
    },
  };
}

export function extractSapiensMessageText(data) {
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";

  return content
    .map((part) => {
      if (typeof part === "string") return part;
      if (typeof part?.text === "string") return part.text;
      return "";
    })
    .join("");
}

export function createSapiensModel(config = {}) {
  return {
    async complete(prompt) {
      const apiKey = config.apiKey || process.env.SAPIENS_API_KEY;
      if (!apiKey) throw new MissingSapiensKeyError();

      const chatRequest = buildSapiensChatRequest(prompt, {
        apiKey,
        baseUrl: config.baseUrl || process.env.SAPIENS_BASE_URL,
        model: config.model || process.env.SAPIENS_MODEL,
        maxTokens: config.maxTokens,
      });

      const res = await fetch(chatRequest.url, {
        method: "POST",
        headers: chatRequest.headers,
        body: JSON.stringify(chatRequest.body),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error("Sapiens error", res.status, errText.slice(0, 300));
        throw new Error("Model call failed");
      }

      return extractSapiensMessageText(await res.json());
    },
  };
}
