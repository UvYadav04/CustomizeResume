import { ChatGroq } from "@langchain/groq";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

// NOTE: createGroqChatModel below is currently unused - tailorGraph.ts
// calls Groq via a plain fetch (providers/groq.ts) instead, because
// ChatGroq's invocationParams() only ever sends a fixed set of fields
// (model/temperature/max_tokens/stop/tools/response_format) with no way to
// pass reasoning_effort/include_reasoning through, which is what's needed
// to turn off the gpt-oss models' reasoning output. Kept here as a
// reference/fallback in case a future @langchain/groq version adds support.
//
// Groq's underlying SDK (groq-sdk) refuses to run in a browser context
// unless explicitly told it's intentional, since shipping a secret API key
// to the browser is normally an anti-pattern for multi-user apps. This is a
// single-user, local-first app where the key never leaves the person's own
// browser/localStorage, so we opt in deliberately.
export function createGroqChatModel(apiKey: string, model: string) {
  return new ChatGroq({
    apiKey,
    model,
    temperature: 0.2,
    // No maxTokens cap - this was previously pinned to 4096, which was too
    // low for a full resume-tailoring response (3 experience entries + 3
    // projects + 5 skill categories) and caused the model to hit
    // finish_reason "length" mid-JSON, producing truncated/invalid output
    // that failed to parse and silently fell through to the next provider
    // in the fallback order. Leaving this unset lets Groq use the model's
    // own max output limit instead of an artificial one we picked.
    clientOptions: { dangerouslyAllowBrowser: true }
  } as ConstructorParameters<typeof ChatGroq>[0]);
}

// Google's Generative AI JS SDK is designed to be usable directly from the
// browser (that's one of its supported use cases), so no extra opt-in flag
// is needed here.
export function createGeminiChatModel(apiKey: string, model: string) {
  return new ChatGoogleGenerativeAI({
    apiKey,
    model,
    temperature: 0.2,
    maxOutputTokens: 4096,
    json: true
  } as ConstructorParameters<typeof ChatGoogleGenerativeAI>[0]);
}
