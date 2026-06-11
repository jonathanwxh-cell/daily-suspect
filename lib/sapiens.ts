export const DEFAULT_SAPIENS_BASE_URL = "https://apihub.agnes-ai.com/v1";
export const DEFAULT_SAPIENS_MODEL = "agnes-2.0-flash";

type ChatMessage = {
  role: "user";
  content: string;
};

export type SapiensChatRequest = {
  url: string;
  headers: Record<string, string>;
  body: {
    model: string;
    max_tokens: number;
    messages: ChatMessage[];
  };
};

export type SapiensConfig = {
  apiKey: string;
  baseUrl?: string;
  model?: string;
  maxTokens?: number;
};

function toChatCompletionsUrl(baseUrl?: string) {
  const normalized = (baseUrl || DEFAULT_SAPIENS_BASE_URL).trim().replace(/\/+$/, "");
  if (normalized.endsWith("/chat/completions")) return normalized;
  return `${normalized}/chat/completions`;
}

export function buildSapiensChatRequest(prompt: string, config: SapiensConfig): SapiensChatRequest {
  return {
    url: toChatCompletionsUrl(config.baseUrl),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: {
      model: config.model?.trim() || DEFAULT_SAPIENS_MODEL,
      max_tokens: config.maxTokens || 1000,
      messages: [{ role: "user", content: prompt }],
    },
  };
}

export function extractSapiensMessageText(data: any): string {
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
