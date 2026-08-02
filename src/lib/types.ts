export interface SkillItem {
  name: string;
  bold: boolean;
}

export interface ResumeLink {
  label: string;
  url: string;
}

export interface ResumeContact {
  email?: string;
  phone?: string;
  location?: string;
  links?: ResumeLink[];
}

export interface ResumeExperience {
  companyName: string;
  role: string;
  duration: string;
  location?: string;
  points: string[];
  skillsUsed: SkillItem[];
}

export interface ResumeProject {
  name: string;
  points: string[];
  techStack: SkillItem[];
  links?: ResumeLink[];
}

export interface ResumeEducation {
  institution: string;
  degree: string;
  duration: string;
  location?: string;
  score?: string;
  coursework?: string[];
}

export interface Resume {
  name: string;
  contact: ResumeContact;
  summary: string;
  skills: Record<string, SkillItem[]>;
  experience: ResumeExperience[];
  projects: ResumeProject[];
  education: ResumeEducation[];
  // Optional trailing section (e.g. clubs, hackathons, positions of
  // responsibility). Rendered as a plain bullet list; hidden entirely when
  // empty, same pattern as education.coursework.
  extraCurricular?: string[];
}

export type ProviderId = "groq" | "openai" | "gemini" | "ollama";

export interface ProviderSettings {
  apiKey: string;
  model: string;
  baseUrl?: string;
  enabled: boolean;
}

// Page padding, in mm, shared by both render paths (CSS preview/print and
// the jsPDF export) so the two stay pixel-consistent. `paddingX` is a single
// value applied to both the left and right edges (they're always kept
// symmetric - there's no separate left/right control).
export interface LayoutSettings {
  paddingTop: number;
  paddingX: number;
  paddingBottom: number;
}

export interface Settings {
  templateId: string;
  skillWhitelist: string[];
  layout: LayoutSettings;
  providerOrder: ProviderId[];
  providers: Record<ProviderId, ProviderSettings>;
}

export interface JobDescription {
  title: string;
  company: string;
  location: string;
  text: string;
  roleType: string;
}

export type SelectionState = "pending" | "accepted" | "rejected";

export interface SuggestedField {
  current: string;
  suggested: string;
  reason: string;
}

export interface SuggestedSkillGroup {
  category: string;
  current: SkillItem[];
  suggested: SkillItem[];
  reason: string;
}

export interface SuggestedExperience {
  companyName: string;
  role: string;
  points: SuggestedField[];
  skillsUsed: {
    current: SkillItem[];
    suggested: SkillItem[];
    reason: string;
  };
}

export interface SuggestedProject {
  name: string;
  points: SuggestedField[];
  techStack: {
    current: SkillItem[];
    suggested: SkillItem[];
    reason: string;
  };
}

export interface Suggestions {
  summary: SuggestedField;
  skills: SuggestedSkillGroup[];
  experience: SuggestedExperience[];
  projects: SuggestedProject[];
}

export interface ExperienceSelection {
  all: SelectionState;
  points: SelectionState[];
  skillsUsed: SelectionState;
}

export interface ProjectSelection {
  all: SelectionState;
  points: SelectionState[];
  techStack: SelectionState;
}

export interface ReviewSelections {
  summary: SelectionState;
  skills: Record<string, SelectionState>;
  experience: Record<number, ExperienceSelection>;
  projects: Record<number, ProjectSelection>;
}

export interface ProviderAttempt {
  provider: ProviderId;
  status: string;
  reason?: string;
}

export interface GenerationMeta {
  providerUsed: ProviderId;
  attempts: ProviderAttempt[];
}

export interface ResumeTemplate {
  id: string;
  label: string;
  description: string;
  audience: "ai" | "sde" | "general";
  styles: string;
  // Mini-template markup (see lib/templates/engine.ts) - not raw HTML with
  // arbitrary JS, just {{field}}/{{#each}}/{{#if}} tokens. Editable live in
  // Settings > Templates.
  defaultHtml: string;
}

export interface TemplateOverride {
  css: string;
  html: string;
}
