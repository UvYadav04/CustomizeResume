import type { JobDescription, LayoutSettings, ProviderId, Settings } from "./types";

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

// Matches what the templates/pdf export shipped with before this became
// user-adjustable (3.5mm top, 11mm left/right, 8mm bottom) - changing these
// numbers only changes what a brand-new/reset Settings starts at, not
// anyone's already-saved layout.
export const DEFAULT_LAYOUT_SETTINGS: LayoutSettings = {
  paddingTop: 3.5,
  paddingX: 11,
  paddingBottom: 8
};

export const DEFAULT_SETTINGS: Settings = {
  templateId: "auto",
  skillWhitelist: [],
  layout: DEFAULT_LAYOUT_SETTINGS,
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
  "Languages",
  "AI Engineering",
  "Backend Development",
  "Databases",
  "Frontend Development",
  "Distributed Systems",
  "Cloud & Infrastructure",
  "Observability"
];

export interface RolePreset {
  id: string;
  label: string;
  audience: "ai" | "sde" | "general";
  description: string;
}

export const ROLE_PRESETS: RolePreset[] = [
  { id: "ai-engineer", label: "AI Engineer", audience: "ai", description: "LLMs, RAG, agentic systems" },
  { id: "fullstack-ai-developer", label: "Full Stack AI Engineer / AI Developer", audience: "ai", description: "AI product + full-stack" },
  { id: "software-developer", label: "Software Development Engineer (SDE)", audience: "sde", description: "Strong SDE with practical GenAI experience" },
  { id: "backend-developer", label: "Backend Engineer", audience: "sde", description: "APIs, databases, distributed systems, infra" }
];

export interface RoleSkillCategory {
  label: string;
  skills: string[];
}


export const ROLE_SKILL_LAYOUTS: Record<string, RoleSkillCategory[]> = {
  "ai-engineer": [
    { label: "Languages", skills: ["Python", "TypeScript", "JavaScript", "SQL", "C++"] },
    { label: "AI Engineering", skills: ["LangChain", "LangGraph", "Multi-Agent Systems", "AI Agents", "Agentic AI", "RAG", "Prompt Engineering", "Vector Databases"] },
    { label: "Generative AI", skills: ["LLMs", "Fine-Tuning", "LoRA", "QLoRA", "Ollama", "ONNX Runtime"] },
    { label: "Backend Development", skills: ["FastAPI", "Node.js", "Express.js", "REST APIs", "MongoDB", "MySQL", "Redis", "Prisma"] },
    { label: "AI Infrastructure, Cloud & Observability", skills: ["Docker", "Kubernetes", "AWS", "Nginx", "Langfuse", "Prometheus", "Grafana", "Loki"] }
  ],
  "fullstack-ai-developer": [
    { label: "Languages", skills: ["Python", "TypeScript", "JavaScript", "SQL", "C++"] },
    { label: "AI Engineering", skills: ["LangChain", "LangGraph", "Multi-Agent Systems", "RAG", "Vector Databases", "LLMs", "Prompt Engineering"] },
    { label: "Frontend Development", skills: ["React", "Next.js", "Redux", "RTK Query", "Zustand", "HTML5", "CSS3", "Tailwind CSS"] },
    { label: "Backend Development", skills: ["FastAPI", "Node.js", "Express.js", "REST APIs", "MongoDB", "MySQL", "Redis", "Prisma", "WebAuthn"] },
    { label: "Cloud, DevOps & Observability", skills: ["Docker", "Kubernetes", "AWS", "GitHub", "GitLab", "Langfuse", "Prometheus", "Grafana", "Loki"] }
  ],
  "software-developer": [
    { label: "Languages", skills: ["Python", "TypeScript", "JavaScript", "SQL", "C++"] },
    { label: "Frontend Engineering", skills: ["React", "Next.js", "Redux", "RTK Query", "Zustand", "TanStack Query", "HTML5", "CSS3", "ShadCN UI"] },
    { label: "Backend Engineering", skills: ["Node.js", "Express.js", "FastAPI", "REST APIs", "JWT", "OAuth 2.0", "Microservices", "MongoDB", "MySQL", "PostgreSQL", "Redis", "Prisma"] },
    { label: "Generative AI", skills: ["LLMs", "Multi-Agent Systems", "RAG", "LangChain", "LangGraph", "Context Engineering", "AutoGen", "Prompt Engineering"] },
    { label: "Cloud, DevOps & Observability", skills: ["Docker", "Kubernetes", "AWS", "Nginx", "GitHub", "GitLab", "CI/CD", "Prometheus", "Grafana", "Loki", "Langfuse", "OpenTelemetry"] }
  ],
  "backend-developer": [
    { label: "Languages", skills: ["Python", "TypeScript", "JavaScript", "SQL", "C++"] },
    { label: "Backend Engineering", skills: ["FastAPI", "Node.js", "Express.js", "REST APIs", "JWT", "OAuth 2.0", "Microservices", "WebAuthn", "Prisma", "BullMQ", "Cron Jobs", "Redis Pub/Sub", "SSE", "Worker Queues", "Kafka", "Caching"] },
    { label: "Databases", skills: ["MongoDB", "MySQL", "PostgreSQL", "Redis", "Redis Vector DB", "Chroma DB", "Qdrant DB"] },
    { label: "Generative AI", skills: ["LLMs", "RAG", "LangChain", "Langgraph", "Multi-agent", "Context Engineering"] },

    { label: "Cloud, DevOps & Observability", skills: ["Docker", "Kubernetes", "AWS", "Nginx", "GitHub", "GitLab", "CI/CD", "Prometheus", "Grafana", "Loki", "Langfuse", "OpenTelemetry"] }
  ]
};

export function roleAudience(roleType: string): "ai" | "sde" | "general" {
  return ROLE_PRESETS.find((preset) => preset.id === roleType)?.audience || "general";
}
