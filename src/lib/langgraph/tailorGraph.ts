// Client-only LangGraph orchestration for the resume-tailoring call.
// No backend/server is involved - this graph runs entirely in the browser
// and calls Groq/Gemini directly via LangChain's chat model clients
// (see chatModels.ts). Ollama stays outside the graph since it already
// talks to a local server via a plain fetch call (ollama.ts) and doesn't
// benefit from a LangChain client wrapper here.
import { StateGraph, Annotation, START, END } from "@langchain/langgraph/web";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { createGeminiChatModel } from "./chatModels";
import { callGroq } from "../providers/groq";
import { callOllama } from "../providers/ollama";
import { ProviderError } from "../providers/errors";
import { PROVIDER_DEFS } from "../constants";
import type { ProviderAttempt, ProviderId, Settings } from "../types";

const TailorState = Annotation.Root({
  system: Annotation<string>,
  user: Annotation<string>,
  result: Annotation<Record<string, unknown> | null>({
    reducer: (_current, update) => update,
    default: () => null
  }),
  providerUsed: Annotation<ProviderId | null>({
    reducer: (_current, update) => update,
    default: () => null
  }),
  attempts: Annotation<ProviderAttempt[]>({
    reducer: (current, update) => current.concat(update),
    default: () => []
  })
});

type TailorGraphState = typeof TailorState.State;

function classifyFailure(error: unknown): string {
  const status = error instanceof ProviderError ? error.status : 0;
  if (status === 401) return "auth_error";
  if (status === 429) return "rate_limited";
  if (status >= 500) return "server_error";
  if (status >= 400) return "request_error";
  if (error instanceof TypeError || error instanceof SyntaxError) return "parse_error";
  return "network_error";
}

function parseJsonContent(content: unknown): Record<string, unknown> {
  const text = typeof content === "string" ? content : JSON.stringify(content);
  const match = text.match(/\{[\s\S]*\}/);
  return JSON.parse(match ? match[0] : text);
}

function extractApiErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Unknown provider error.";
}

// Groq: called via a direct fetch to Groq's REST API (see providers/groq.ts),
// not LangChain's ChatGroq client - ChatGroq has no passthrough for
// reasoning_effort/include_reasoning, which is what turns off the gpt-oss
// models' reasoning output (unwanted here: we only need the final JSON, and
// that hidden reasoning text was eating into the output-token budget).
async function callGroqViaLangGraph(apiKey: string, model: string, system: string, user: string) {
  return callGroq({ apiKey, model, system, user });
}

// Gemini: called through LangChain's ChatGoogleGenerativeAI client.
async function callGeminiViaLangGraph(apiKey: string, model: string, system: string, user: string) {
  const chat = createGeminiChatModel(apiKey, model);
  const response = await chat.invoke([new SystemMessage(system), new HumanMessage(user)]);
  return parseJsonContent(response.content);
}

function makeNode(providerId: ProviderId, run: () => Promise<Record<string, unknown>>) {
  return async (_state: TailorGraphState): Promise<Partial<TailorGraphState>> => {
    try {
      const raw = await run();
      return {
        result: raw,
        providerUsed: providerId,
        attempts: [{ provider: providerId, status: "success" }]
      };
    } catch (error) {
      return {
        attempts: [
          {
            provider: providerId,
            status: classifyFailure(error),
            reason: extractApiErrorMessage(error)
          }
        ]
      };
    }
  };
}

function isUsable(providerId: ProviderId, settings: Settings): boolean {
  const providerSettings = settings.providers?.[providerId];
  const requiresApiKey = PROVIDER_DEFS[providerId]?.requiresApiKey !== false;
  if (!providerSettings?.enabled) return false;
  if (requiresApiKey && !providerSettings.apiKey) return false;
  return true;
}

// Builds a fresh graph per call, wired for exactly the providers that are
// enabled/configured, in the order the person set in Settings. Each node
// runs, and a conditional edge sends the flow to the next node only if the
// previous one didn't produce a result (i.e. it failed) - otherwise it goes
// straight to END, mirroring the old sequential-fallback behavior but as an
// actual LangGraph state machine.
function buildGraph(order: ProviderId[], system: string, user: string, settings: Settings) {
  const graph = new StateGraph(TailorState);

  for (const providerId of order) {
    const providerSettings = settings.providers[providerId];
    if (providerId === "groq") {
      graph.addNode("groq", makeNode("groq", () => callGroqViaLangGraph(providerSettings.apiKey, providerSettings.model, system, user)));
    } else if (providerId === "gemini") {
      graph.addNode("gemini", makeNode("gemini", () => callGeminiViaLangGraph(providerSettings.apiKey, providerSettings.model, system, user)));
    } else if (providerId === "ollama") {
      graph.addNode(
        "ollama",
        makeNode("ollama", () =>
          callOllama({
            apiKey: providerSettings.apiKey,
            model: providerSettings.model,
            baseUrl: providerSettings.baseUrl,
            system,
            user
          })
        )
      );
    }
  }

  if (!order.length) {
    graph.addEdge(START, END);
    return graph.compile();
  }

  graph.addEdge(START, order[0] as any);

  order.forEach((providerId, index) => {
    const nextNode = order[index + 1];
    graph.addConditionalEdges(
      providerId as any,
      (state: TailorGraphState) => (state.result ? "done" : nextNode ? "continue" : "done"),
      nextNode ? { done: END, continue: nextNode as any } : { done: END }
    );
  });

  return graph.compile();
}

export async function runTailorGraph({
  system,
  user,
  settings
}: {
  system: string;
  user: string;
  settings: Settings;
}): Promise<{ result: Record<string, unknown> | null; providerUsed: ProviderId | null; attempts: ProviderAttempt[] }> {
  const order = (settings.providerOrder || []).filter((id) => isUsable(id, settings));
  const skipped: ProviderAttempt[] = (settings.providerOrder || [])
    .filter((id) => !order.includes(id))
    .map((id) => ({
      provider: id,
      status: "skipped",
      reason: settings.providers[id]?.enabled
        ? "Missing API key."
        : "Disabled provider."
    }));

  const app = buildGraph(order, system, user, settings);
  const finalState = await app.invoke({ system, user });

  return {
    result: finalState.result,
    providerUsed: finalState.providerUsed,
    attempts: [...finalState.attempts, ...skipped]
  };
}
