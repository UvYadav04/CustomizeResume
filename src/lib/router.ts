import { buildTailorPrompt } from "./prompt";
import { normalizeSuggestions } from "./resume-utils";
import { runTailorGraph } from "./langgraph/tailorGraph";
import type { GenerationMeta, JobDescription, Resume, Settings, Suggestions } from "./types";

// Groq and Gemini are called through the LangGraph client-side graph
// (see langgraph/tailorGraph.ts) - no backend/server involved, everything
// runs in the browser. Ollama is called separately inside that same graph
// via a plain fetch to the local Ollama server.
export async function tailorResumeWithFallback({
  resume,
  jobDescription,
  settings
}: {
  resume: Resume;
  jobDescription: JobDescription;
  settings: Settings;
}): Promise<GenerationMeta & { suggestions: Suggestions }> {
  const prompt = buildTailorPrompt(resume, jobDescription, settings);

  const { result, providerUsed, attempts } = await runTailorGraph({
    system: prompt.system,
    user: prompt.user,
    settings
  });

  if (!result || !providerUsed) {
    const lastFailure = [...attempts].reverse().find((attempt) => attempt.status !== "skipped");
    const err = new Error(lastFailure?.reason || "All providers failed.") as Error & {
      attempts: typeof attempts;
    };
    err.attempts = attempts;
    throw err;
  }

  return {
    providerUsed,
    attempts,
    suggestions: normalizeSuggestions(result, resume, {
      skillWhitelist: settings.skillWhitelist || [],
      jobDescriptionText: jobDescription.text || ""
    })
  };
}
