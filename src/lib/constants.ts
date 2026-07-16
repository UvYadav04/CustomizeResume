import type { JobDescription, ProviderId, Settings } from "./types";

export const STORAGE_KEYS = {
  settings: "resumeTailor.settings",
  resume: "resumeTailor.resume",
  workflow: "resumeTailor.workflow",
  templateOverrides: "resumeTailor.templateOverrides"
};

// Base filename for downloaded PDFs (e.g. "Dinesh_IIITV.pdf", or
// "Dinesh_IIITV_Acme.pdf" when a company is filled in) - personal to this
// resume, not derived from resume.name, since that's "Dinesh Yadav" and
// this is a deliberate, separate naming choice. Change freely.
export const RESUME_FILE_BASENAME = "Dinesh_IIITV";

export const PROVIDER_DEFS: Record<
  ProviderId,
  { id: ProviderId; label: string; defaultModel: string; defaultBaseUrl?: string; requiresApiKey: boolean }
> = {
  groq: {
    id: "groq",
    label: "Groq",
    defaultModel: "openai/gpt-oss-120b",
    requiresApiKey: true
  },
  openai: {
    id: "openai",
    label: "OpenAI",
    defaultModel: "gpt-4.1-mini",
    requiresApiKey: true
  },
  gemini: {
    id: "gemini",
    label: "Gemini",
    defaultModel: "gemini-2.5-flash",
    requiresApiKey: true
  },
  ollama: {
    id: "ollama",
    label: "Ollama (Local)",
    defaultModel: "llama3.1",
    defaultBaseUrl: "http://localhost:11434",
    requiresApiKey: false
  }
};

// Only the three providers requested for this app's Settings UI. OpenAI
// stays wired up in the router for parity with the extension but is not
// surfaced as a first-class tab.
export const ACTIVE_PROVIDER_ORDER: ProviderId[] = ["groq", "gemini", "ollama"];

export const DEFAULT_SETTINGS: Settings = {
  templateId: "auto",
  skillWhitelist: [],
  providerOrder: ["groq", "gemini", "ollama"],
  providers: {
    groq: {
      apiKey: "",
      model: PROVIDER_DEFS.groq.defaultModel,
      enabled: true
    },
    openai: {
      apiKey: "",
      model: PROVIDER_DEFS.openai.defaultModel,
      enabled: false
    },
    gemini: {
      apiKey: "",
      model: PROVIDER_DEFS.gemini.defaultModel,
      enabled: true
    },
    ollama: {
      apiKey: "",
      model: PROVIDER_DEFS.ollama.defaultModel,
      baseUrl: PROVIDER_DEFS.ollama.defaultBaseUrl,
      enabled: true
    }
  }
};

export function createDefaultJobDescription(): JobDescription {
  return {
    title: "",
    company: "",
    location: "",
    text: "",
    roleType: "ai-engineer"
  };
}

export const SKILL_CATEGORY_ORDER = [
  "Programming Languages",
  "Frontend",
  "Backend",
  "Databases",
  "AI & GenAI",
  "AI Systems & Architecture",
  "Deep Learning",
  "Software Engineering",
  "Libraries & Frameworks",
  "Tools / DevOps / Cloud"
];

export interface RolePreset {
  id: string;
  label: string;
  audience: "ai" | "sde" | "general";
  description: string;
}

export const ROLE_PRESETS: RolePreset[] = [
  { id: "ai-engineer", label: "AI Engineer", audience: "ai", description: "LLMs, RAG, agentic systems" },
  { id: "fullstack-ai-developer", label: "Full Stack AI Developer", audience: "ai", description: "AI product + full-stack" },
  { id: "software-developer", label: "Software Developer", audience: "sde", description: "General SDE, systems-focused" },
  { id: "fullstack-developer", label: "Full Stack Developer", audience: "sde", description: "Frontend + backend" },
  { id: "backend-developer", label: "Backend Developer", audience: "sde", description: "APIs, data, infra" }
];

// Fixed to exactly 5 category titles per role (agreed in chat). Each role
// only ever sends/receives these 5 categories to the model - it reorders
// and rebolds skills *within* them, never introduces a category that isn't
// listed here for that role.
export const ROLE_CATEGORY_ORDER: Record<string, string[]> = {
  "ai-engineer": ["Programming Languages", "AI & GenAI", "AI Systems & Architecture", "Deep Learning", "Databases"],
  "fullstack-ai-developer": ["Programming Languages", "AI & GenAI", "Frontend", "Backend", "Databases"],
  "software-developer": ["Programming Languages", "Software Engineering", "Backend", "Databases", "Tools / DevOps / Cloud"],
  "fullstack-developer": ["Programming Languages", "Frontend", "Backend", "Databases", "Libraries & Frameworks"],
  "backend-developer": ["Programming Languages", "Backend", "Databases", "Software Engineering", "Tools / DevOps / Cloud"]
};

export function roleAudience(roleType: string): "ai" | "sde" | "general" {
  return ROLE_PRESETS.find((preset) => preset.id === roleType)?.audience || "general";
}
