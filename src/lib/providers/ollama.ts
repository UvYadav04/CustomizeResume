import { ProviderError } from "./errors";

// Ollama runs locally and exposes an OpenAI-compatible endpoint. Requires
// `OLLAMA_ORIGINS=*` (or your dev origin) set on the Ollama server so the
// browser is allowed to call it cross-origin.
export async function callOllama({
  apiKey,
  model,
  baseUrl,
  system,
  user
}: {
  apiKey?: string;
  model: string;
  baseUrl?: string;
  system: string;
  user: string;
}) {
  const base = String(baseUrl || "http://localhost:11434").replace(/\/+$/, "");
  const url = `${base}/v1/chat/completions`;

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_completion_tokens: 4096,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user }
        ]
      })
    });
  } catch {
    throw new ProviderError(
      0,
      `Could not reach Ollama at ${base}. Make sure it's running locally (ollama serve), has OLLAMA_ORIGINS set to allow this site, and that this URL matches your setup.`
    );
  }

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ProviderError(response.status, body?.error?.message || body?.error || "Ollama request failed.");
  }

  const content = body?.choices?.[0]?.message?.content;
  if (!content) {
    throw new ProviderError(500, "Ollama returned no message content.");
  }
  return JSON.parse(content);
}
