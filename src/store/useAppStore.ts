import { create } from "zustand";
import { createDefaultJobDescription, DEFAULT_SETTINGS } from "@/lib/constants";
import { getResume, getSettings, getTemplateOverrides, saveResume, saveSettings, saveTemplateOverrides } from "@/lib/storage";
import {
  applyAcceptedChanges,
  backfillMissingSkillCategories,
  buildRoleScopedResume,
  createDefaultReviewSelections,
  setSectionSelection
} from "@/lib/resume-utils";
import { tailorResumeWithFallback } from "@/lib/router";
import { clone } from "@/lib/utils";
import { RESUME_SEED } from "@/data/resume-seed";
import type {
  ExperienceSelection,
  GenerationMeta,
  JobDescription,
  ProjectSelection,
  Resume,
  ReviewSelections,
  SelectionState,
  Settings,
  SkillItem,
  Suggestions,
  TemplateOverride
} from "@/lib/types";

interface AppState {
  hydrated: boolean;
  // Master resume - full skill set, persisted. Only ever written by
  // setResume() (Settings > Summary/Skills edits). generate() must NEVER
  // overwrite or persist this, or every category outside the current role's
  // 5-category scope gets permanently deleted from storage.
  resume: Resume;
  // Ephemeral, in-memory only: the current generation's role-scoped copy
  // (same resume, but .skills trimmed to the selected role's 5 categories).
  // This is what suggestions/preview/PDF are based on once a generation has
  // run; it's rebuilt fresh on every "Customize" click and never persisted.
  roleScopedResume: Resume | null;
  settings: Settings;
  templateOverrides: Record<string, TemplateOverride>;
  jobDescription: JobDescription;
  suggestions: Suggestions | null;
  selections: ReviewSelections | null;
  generationMeta: GenerationMeta | null;
  isGenerating: boolean;
  error: string;

  hydrate: () => Promise<void>;
  setResume: (resume: Resume) => Promise<void>;
  setSettings: (settings: Settings) => Promise<void>;
  // Explicit save-only mutation - called from the Templates tab's Save
  // button, never on every keystroke.
  saveTemplateOverride: (templateId: string, override: TemplateOverride) => Promise<void>;
  resetTemplateOverride: (templateId: string) => Promise<void>;
  setJobDescription: (patch: Partial<JobDescription>) => void;
  generate: () => Promise<void>;
  setPointSelection: (kind: "summary", value: SelectionState) => void;
  setSkillSelection: (category: string, value: SelectionState) => void;
  setExperienceSelection: (index: number, patch: Partial<ExperienceSelection>) => void;
  setProjectSelection: (index: number, patch: Partial<ProjectSelection>) => void;
  bulkSetSection: (section: "summary" | "skills" | "experience" | "projects", value: SelectionState) => void;
  // Lets the person hand-edit a suggestion in place (add a word to the
  // summary, drop a skill, etc.) before/after accepting it - these just
  // rewrite the relevant `.suggested` field on the in-memory suggestions
  // object. Whether the edit actually lands in the exported resume still
  // depends on the row's accept/reject state, same as before.
  editSummarySuggestion: (text: string) => void;
  editSkillGroupSuggestion: (category: string, items: SkillItem[]) => void;
  editExperiencePointSuggestion: (entryIndex: number, pointIndex: number, text: string) => void;
  editExperienceSkillsUsedSuggestion: (entryIndex: number, items: SkillItem[]) => void;
  editProjectAboutSuggestion: (projectIndex: number, text: string) => void;
  editProjectTechStackSuggestion: (projectIndex: number, items: SkillItem[]) => void;
  reset: () => void;
  previewResume: () => Resume;
}

export const useAppStore = create<AppState>((set, get) => ({
  hydrated: false,
  resume: RESUME_SEED,
  roleScopedResume: null,
  settings: DEFAULT_SETTINGS,
  templateOverrides: {},
  jobDescription: createDefaultJobDescription(),
  suggestions: null,
  selections: null,
  generationMeta: null,
  isGenerating: false,
  error: "",

  hydrate: async () => {
    const [storedResume, settings, templateOverrides] = await Promise.all([
      getResume(),
      getSettings(),
      getTemplateOverrides()
    ]);

    let resume = storedResume || RESUME_SEED;
    let needsSave = !storedResume;

    if (storedResume) {
      // Self-heal: an earlier bug in generate() could have persisted a
      // resume with entire skill categories missing (see
      // backfillMissingSkillCategories's comment). Repair it once here,
      // additively, without touching anything the person has customized.
      const repaired = backfillMissingSkillCategories(storedResume, RESUME_SEED.skills);
      if (repaired.changed) {
        resume = repaired.resume;
        needsSave = true;
      }
    }

    set({ resume, settings, templateOverrides, hydrated: true });

    if (needsSave) {
      await saveResume(resume);
    }
  },

  setResume: async (resume) => {
    set({ resume });
    await saveResume(resume);
  },

  setSettings: async (settings) => {
    set({ settings });
    await saveSettings(settings);
  },

  saveTemplateOverride: async (templateId, override) => {
    const next = { ...get().templateOverrides, [templateId]: override };
    set({ templateOverrides: next });
    await saveTemplateOverrides(next);
  },

  resetTemplateOverride: async (templateId) => {
    const next = { ...get().templateOverrides };
    delete next[templateId];
    set({ templateOverrides: next });
    await saveTemplateOverrides(next);
  },

  setJobDescription: (patch) => {
    set({ jobDescription: { ...get().jobDescription, ...patch } });
  },

  generate: async () => {
    const { resume, jobDescription, settings } = get();
    set({ isGenerating: true, error: "" });
    try {
      // Trimmed to the role's 5 skill categories, for this generation only.
      // Built fresh from the untouched master `resume` every time - never
      // the other way around.
      const roleScopedResume = buildRoleScopedResume(resume, jobDescription.roleType);
      const result = await tailorResumeWithFallback({
        resume: roleScopedResume,
        jobDescription,
        settings
      });
      set({
        suggestions: result.suggestions,
        selections: createDefaultReviewSelections(result.suggestions),
        generationMeta: { providerUsed: result.providerUsed, attempts: result.attempts },
        roleScopedResume,
        isGenerating: false
      });
      // Intentionally NOT calling setResume/saveResume here - the master
      // resume (and its full skill set) must stay exactly as the person
      // edited it in Settings, regardless of which role was last generated.
    } catch (error) {
      set({
        isGenerating: false,
        error: error instanceof Error ? error.message : "Generation failed."
      });
      throw error;
    }
  },

  setPointSelection: (_kind, value) => {
    const { selections } = get();
    if (!selections) return;
    set({ selections: setSectionSelectionScalar(selections, "summary", value) });
  },

  setSkillSelection: (category, value) => {
    const { selections } = get();
    if (!selections) return;
    const next = clone(selections);
    next.skills[category] = value;
    set({ selections: next });
  },

  setExperienceSelection: (index, patch) => {
    const { selections } = get();
    if (!selections) return;
    const next = clone(selections);
    next.experience[index] = { ...next.experience[index], ...patch } as ExperienceSelection;
    set({ selections: next });
  },

  setProjectSelection: (index, patch) => {
    const { selections } = get();
    if (!selections) return;
    const next = clone(selections);
    next.projects[index] = { ...next.projects[index], ...patch } as ProjectSelection;
    set({ selections: next });
  },

  bulkSetSection: (section, value) => {
    const { selections } = get();
    if (!selections) return;
    set({ selections: setSectionSelection(selections, section, value) });
  },

  editSummarySuggestion: (text) => {
    const { suggestions } = get();
    if (!suggestions) return;
    const next = clone(suggestions);
    next.summary.suggested = text;
    set({ suggestions: next });
  },

  editSkillGroupSuggestion: (category, items) => {
    const { suggestions } = get();
    if (!suggestions) return;
    const next = clone(suggestions);
    const group = next.skills.find((g) => g.category === category);
    if (!group) return;
    group.suggested = items;
    set({ suggestions: next });
  },

  editExperiencePointSuggestion: (entryIndex, pointIndex, text) => {
    const { suggestions } = get();
    if (!suggestions) return;
    const next = clone(suggestions);
    const entry = next.experience[entryIndex];
    if (!entry?.points[pointIndex]) return;
    entry.points[pointIndex].suggested = text;
    set({ suggestions: next });
  },

  editExperienceSkillsUsedSuggestion: (entryIndex, items) => {
    const { suggestions } = get();
    if (!suggestions) return;
    const next = clone(suggestions);
    const entry = next.experience[entryIndex];
    if (!entry) return;
    entry.skillsUsed.suggested = items;
    set({ suggestions: next });
  },

  editProjectAboutSuggestion: (projectIndex, text) => {
    const { suggestions } = get();
    if (!suggestions) return;
    const next = clone(suggestions);
    const project = next.projects[projectIndex];
    if (!project) return;
    project.about.suggested = text;
    set({ suggestions: next });
  },

  editProjectTechStackSuggestion: (projectIndex, items) => {
    const { suggestions } = get();
    if (!suggestions) return;
    const next = clone(suggestions);
    const project = next.projects[projectIndex];
    if (!project) return;
    project.techStack.suggested = items;
    set({ suggestions: next });
  },

  reset: () => {
    set({
      jobDescription: createDefaultJobDescription(),
      roleScopedResume: null,
      suggestions: null,
      selections: null,
      generationMeta: null,
      error: ""
    });
  },

  previewResume: () => {
    const { resume, roleScopedResume, suggestions, selections } = get();
    const base = roleScopedResume || resume;
    if (!suggestions || !selections) {
      return base;
    }
    return applyAcceptedChanges(base, suggestions, selections);
  }
}));

function setSectionSelectionScalar(selections: ReviewSelections, _section: "summary", value: SelectionState): ReviewSelections {
  const next = clone(selections);
  next.summary = value;
  return next;
}
