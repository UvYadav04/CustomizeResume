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

// Matches the exact union of category labels used across ROLE_SKILL_LAYOUTS
// below (see resume-seed.ts's skills block, which now uses these same 10
// labels as its keys) - just controls display order in Settings > Skills.
export const SKILL_CATEGORY_ORDER = [
  "Languages",
  "AI Engineering",
  "Generative AI",
  "Frontend Development",
  "Frontend Engineering",
  "Backend Development",
  "Backend Engineering",
  "Databases",
  "AI Infrastructure, Cloud & Observability",
  "Cloud, DevOps & Observability"
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
    { label: "AI Engineering", skills: ["LangChain", "LangGraph", "Multi-Agent Systems", "AI Agents", "Agentic AI", "RAG", "Prompt Engineering", "Vector Databases", "Embeddings", "Reranking"] },
    { label: "Generative AI", skills: ["LLMs", "Fine-Tuning", "LoRA", "QLoRA", "Ollama", "ONNX Runtime"] },
    { label: "Backend Development", skills: ["FastAPI", "Node.js", "Express.js", "REST APIs", "MongoDB", "MySQL", "Redis", "Prisma", "ARQ", "Pydantic"] },
    { label: "AI Infrastructure, Cloud & Observability", skills: ["Docker", "Kubernetes", "AWS", "Nginx", "Langfuse", "Prometheus", "Grafana", "Loki"] }
  ],
  "fullstack-ai-developer": [
    { label: "Languages", skills: ["Python", "TypeScript", "JavaScript", "SQL", "C++"] },
    { label: "AI Engineering", skills: ["LangChain", "LangGraph", "Multi-Agent Systems", "RAG", "Vector Databases", "LLMs", "Prompt Engineering", "Embeddings", "Reranking"] },
    { label: "Frontend Development", skills: ["React", "Next.js", "Redux", "RTK Query", "Zustand", "HTML5", "CSS3", "Tailwind CSS", "Zod", "Server-Side Rendering"] },
    { label: "Backend Development", skills: ["FastAPI", "Node.js", "Express.js", "REST APIs", "MongoDB", "MySQL", "Redis", "Prisma", "WebAuthn", "ARQ", "Pydantic"] },
    { label: "Cloud, DevOps & Observability", skills: ["Docker", "Kubernetes", "AWS", "GitHub", "GitLab", "Langfuse", "Prometheus", "Grafana", "Loki"] }
  ],
  "software-developer": [
    { label: "Languages", skills: ["Python", "TypeScript", "JavaScript", "SQL", "C++"] },
    { label: "Frontend Engineering", skills: ["React", "Next.js", "Redux", "RTK Query", "Zustand", "TanStack Query", "HTML5", "CSS3", "ShadCN UI", "Zod", "Server-Side Rendering"] },
    { label: "Backend Engineering", skills: ["Node.js", "Express.js", "FastAPI", "REST APIs", "JWT", "OAuth 2.0", "Microservices", "MongoDB", "MySQL", "PostgreSQL", "Redis", "Prisma", "ARQ", "Pydantic"] },
    { label: "Generative AI", skills: ["LLMs", "Multi-Agent Systems", "RAG", "LangChain", "LangGraph", "Context Engineering", "AutoGen", "Prompt Engineering", "Embeddings", "Reranking"] },
    { label: "Cloud, DevOps & Observability", skills: ["Docker", "Kubernetes", "AWS", "Nginx", "GitHub", "GitLab", "CI/CD", "Prometheus", "Grafana", "Loki", "Langfuse", "OpenTelemetry"] }
  ],
  // NOTE: "Generative AI" here is deliberately left at 6 items (not
  // enriched with Embeddings/Reranking like the other roles' equivalent
  // category) - going to 8 pushed it past the MAX_VISIBLE_SKILLS(7) render
  // cap for the first time and wrapped the row in the preview, which
  // overflowed the page. Every other category below was already well past
  // that cap before enrichment, so adding to those doesn't change what
  // renders. If more room is needed here later, prefer trimming something
  // else out rather than letting this one cross 7.
  "backend-developer": [
    { label: "Languages", skills: ["Python", "TypeScript", "JavaScript", "SQL", "C++"] },
    { label: "Backend Engineering", skills: ["FastAPI", "Node.js", "Express.js", "REST APIs", "JWT", "OAuth 2.0", "Microservices", "WebAuthn", "Prisma", "BullMQ", "Cron Jobs", "Redis Pub/Sub", "SSE", "Worker Queues", "Kafka", "Caching", "ARQ", "Pydantic"] },
    { label: "Databases", skills: ["MongoDB", "MySQL", "PostgreSQL", "Redis", "Redis Vector DB", "Chroma DB", "Qdrant DB"] },
    { label: "Generative AI", skills: ["LLMs", "RAG", "LangChain", "Langgraph", "Multi-agent", "Context Engineering"] },

    { label: "Cloud, DevOps & Observability", skills: ["Docker", "Kubernetes", "AWS", "Nginx", "GitHub", "GitLab", "CI/CD", "Prometheus", "Grafana", "Loki", "Langfuse", "OpenTelemetry"] }
  ]
};

export function roleAudience(roleType: string): "ai" | "sde" | "general" {
  return ROLE_PRESETS.find((preset) => preset.id === roleType)?.audience || "general";
}
