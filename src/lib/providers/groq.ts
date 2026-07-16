import { ProviderError } from "./errors";

// This is what the LangGraph tailoring graph actually calls for Groq (see
// callGroqViaLangGraph in ../langgraph/tailorGraph.ts) - a plain fetch
// straight to Groq's REST API, not LangChain's ChatGroq client. ChatGroq's
// invocationParams() only ever sends a fixed set of fields (model,
// temperature, max_tokens, stop, tools, response_format) with no
// passthrough for extra params, so there's no way to send
// reasoning_effort/include_reasoning through it. Calling the REST API
// directly gives full control over the request body instead.
export async function callGroq({
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
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      // No max_completion_tokens cap - was 4096, too low for a full
      // resume-tailoring response and caused mid-JSON truncation.
      response_format: { type: "json_object" },
      // gpt-oss models on Groq default to including a "reasoning" field in
      // the response (their internal chain-of-thought), which we never
      // read and don't want: it burns output-token budget before the
      // model even starts writing the actual JSON, and was very likely
      // the real cause of the earlier truncated-JSON failures, not just
      // the 4096 cap. reasoning_effort: "low" minimizes how much thinking
      // it does, include_reasoning: false drops the field from the
      // response entirely. Both are ignored (harmless) by non-reasoning
      // Groq models.
      reasoning_effort: "low",
      include_reasoning: false,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user }
      ]
    })
  });

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const baseMessage = body?.error?.message || "Groq request failed.";
    const failedGeneration = body?.error?.failed_generation || body?.failed_generation;
    const message = failedGeneration
      ? `${baseMessage} Raw model output: ${String(failedGeneration).slice(0, 400)}`
      : baseMessage;
    throw new ProviderError(response.status, message);
  }

  const content = body?.choices?.[0]?.message?.content;
  if (!content) {
    throw new ProviderError(500, "Groq returned no message content.");
  }
  return JSON.parse(content);
}
