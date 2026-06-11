const DEFAULT_API_URL = "http://127.0.0.1:4117";

export const API_BASE_URL = (process.env.NEXT_PUBLIC_DAILY_SUSPECT_API_URL || DEFAULT_API_URL).replace(/\/+$/, "");

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof data.error === "string" ? data.error : "request failed");
  }
  return data as T;
}
