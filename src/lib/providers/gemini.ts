import { ProviderError } from "./errors";

// Superseded by src/lib/langgraph/chatModels.ts (createGeminiChatModel),
// which is what the app actually calls now via the LangGraph tailoring
// graph. Kept only as a plain-fetch reference implementation.
export async function callGemini({
  apiKey,
  model,
  system,
  user
}: {
  apiKey: string;
  model: string;
  system: string;
  user: string;
}) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: `${system}\n\n${user}` }]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 4096,
          responseMimeType: "application/json"
        }
      })
    }
  );

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ProviderError(response.status, body?.error?.message || "Gemini request failed.");
  }

  const content =
    body?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || "").join("") || "";
  if (!content) {
    throw new ProviderError(500, "Gemini returned no message content.");
  }
  return JSON.parse(content);
}
