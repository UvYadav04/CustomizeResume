import { clone, sanitizeSkillList } from "./utils";
import { ROLE_CATEGORY_ORDER } from "./constants";
import type {
  ExperienceSelection,
  ProjectSelection,
  Resume,
  ReviewSelections,
  SelectionState,
  SkillItem,
  Suggestions
} from "./types";

// Hard ceiling: never show more than this many skills per category/skillsUsed/
// techStack array, full stop. The model is asked to pick its best ~7 (see
// prompt.ts), and lib/skillLineFit.ts additionally trims down from here at
// render time if even 7 doesn't fit on one line for a category with long
// skill names - but this number is the absolute max either way.
const MAX_VISIBLE_SKILLS = 7;
const LENGTH_TOLERANCE_RATIO = 1.15;

export function clampToLength(text: string, referenceText: string, toleranceRatio = LENGTH_TOLERANCE_RATIO): string {
  const value = String(text || "");
  const referenceLength = String(referenceText || "").length;
  if (!referenceLength) {
    return value;
  }
  const maxLen = Math.ceil(referenceLength * toleranceRatio);
  if (value.length <= maxLen) {
    return value;
  }
  const truncated = value.slice(0, maxLen);
  const lastSentenceEnd = Math.max(
    truncated.lastIndexOf(". "),
    truncated.lastIndexOf("! "),
    truncated.lastIndexOf("? ")
  );
  if (lastSentenceEnd > maxLen * 0.5) {
    return truncated.slice(0, lastSentenceEnd + 1).trim();
  }
  const lastSpace = truncated.lastIndexOf(" ");
  const cut = lastSpace > maxLen * 0.5 ? truncated.slice(0, lastSpace) : truncated;
  return `${cut.trim().replace(/[,;:]+$/, "")}.`;
}

// Additive-only repair: adds back any skill category whose KEY is entirely
// missing from `resume.skills`, using `seedSkills` (typically the shipped
// RESUME_SEED) as the source. Deliberately does NOT touch a category that's
// merely an empty array - that's a category the person intentionally
// cleared out in the Skills tab, and clearing it stores an empty array
// under that key, so it's distinguishable from "never existed."
//
// This exists to self-heal a resume that got its skill categories
// truncated by an earlier version of generate() (which used to persist the
// role-scoped ~5-category copy over the master resume - fixed now, but
// anyone who already hit that bug has a permanently truncated resume sitting
// in their localStorage that this repairs automatically on next load).
export function backfillMissingSkillCategories(resume: Resume, seedSkills: Record<string, SkillItem[]>): { resume: Resume; changed: boolean } {
  const existingKeys = new Set(Object.keys(resume.skills || {}));
  const missing = Object.entries(seedSkills || {}).filter(([category]) => !existingKeys.has(category));

  if (!missing.length) {
    return { resume, changed: false };
  }

  const nextSkills: Record<string, SkillItem[]> = { ...(resume.skills || {}) };
  for (const [category, seedItems] of missing) {
    nextSkills[category] = seedItems.map((item) => ({ name: item.name, bold: false }));
  }

  return { resume: { ...resume, skills: nextSkills }, changed: true };
}

// Replaces resume.skills with just the categories the chosen role includes,
// in that role's order. Falls back to the full master skill set when
// roleType is empty/unknown.
export function buildRoleScopedResume(resume: Resume, roleType: string): Resume {
  const order = ROLE_CATEGORY_ORDER[roleType];
  if (!order) {
    return clone(resume);
  }
  const next = clone(resume);
  const masterSkills = resume.skills || {};
  const scopedSkills: Record<string, SkillItem[]> = {};
  for (const category of order) {
    if (masterSkills[category]?.length) {
      scopedSkills[category] = clone(masterSkills[category]);
    }
  }
  next.skills = Object.keys(scopedSkills).length ? scopedSkills : clone(masterSkills);
  return next;
}

function withLength(text: string) {
  const value = String(text || "");
  return { text: value, len: value.length };
}

function withSkillArray(items: SkillItem[] = []) {
  return items.map((item) => ({ name: item.name, bold: Boolean(item.bold) }));
}

// What gets SENT to the model as candidates - deliberately much higher than
// MAX_VISIBLE_SKILLS (the display cap). If this were capped near the
// display limit, the model could only ever pick from an arbitrary early
// slice of a category and would never even see a JD-relevant skill sitting
// further down the list. 30 comfortably covers every built-in category
// (the largest, "AI & GenAI", has 25) so the model genuinely sees
// everything real it could choose from.
const MAX_CANDIDATE_SKILLS_PER_ARRAY = 30;

export function getMutableResumePayload(resume: Resume) {
  return {
    summary: withLength(resume.summary),
    skills: Object.fromEntries(
      Object.entries(resume.skills || {}).map(([category, items]) => [
        category,
        withSkillArray(items).slice(0, MAX_CANDIDATE_SKILLS_PER_ARRAY)
      ])
    ),
    experience: (resume.experience || []).map((item) => ({
      companyName: item.companyName,
      role: item.role,
      points: (item.points || []).map((point) => withLength(point)),
      skillsUsed: withSkillArray(item.skillsUsed || []).slice(0, MAX_CANDIDATE_SKILLS_PER_ARRAY)
    })),
    projects: (resume.projects || []).map((item) => ({
      name: item.name,
      about: withLength(item.about),
      techStack: withSkillArray(item.techStack || []).slice(0, MAX_CANDIDATE_SKILLS_PER_ARRAY)
    }))
  };
}

function ensureNonEmptySkillList(
  suggested: SkillItem[],
  current: SkillItem[],
  sanitizeOptions: { whitelist: string[]; maxItems: number }
): SkillItem[] {
  const sanitized = sanitizeSkillList(suggested, current, sanitizeOptions);
  return sanitized.length ? sanitized : clone(current);
}

function escapeRegExp(value: string): string {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isJobDescriptionKeyword(name: string, jdTextLower: string): boolean {
  if (!name || !jdTextLower) {
    return false;
  }
  const pattern = new RegExp(`(?:^|[^a-z0-9+])${escapeRegExp(name.toLowerCase())}(?:$|[^a-z0-9+])`, "i");
  return pattern.test(jdTextLower);
}

function applyKeywordBold(items: SkillItem[], jdTextLower: string): SkillItem[] {
  if (!jdTextLower) {
    return items;
  }
  return items.map((item) => ({
    ...item,
    bold: item.bold || isJobDescriptionKeyword(item.name, jdTextLower)
  }));
}

function extractSuggestedText(value: any, fallback = ""): string {
  if (typeof value === "string") {
    return value;
  }
  if (value && typeof value === "object") {
    if (typeof value.suggested === "string") {
      return value.suggested;
    }
    if (typeof value.text === "string") {
      return value.text;
    }
  }
  return fallback;
}

function extractSkillArray(value: any): SkillItem[] {
  if (Array.isArray(value)) {
    if (value.length && value[0]?.category !== undefined) {
      return [];
    }
    return value;
  }
  if (value?.suggested && Array.isArray(value.suggested)) {
    return value.suggested;
  }
  return [];
}

function normalizeRawModelOutput(raw: any, resume: Resume) {
  if (!raw || typeof raw !== "object") {
    return { summary: {} as any, skills: [] as any[], experience: [] as any[], projects: [] as any[] };
  }

  let skills: any[] = [];
  if (Array.isArray(raw.skills)) {
    skills = raw.skills.map((item: any) => ({
      category: item.category,
      suggested: extractSkillArray(item.suggested ?? item),
      reason: item.reason || ""
    }));
  } else if (raw.skills && typeof raw.skills === "object") {
    skills = Object.entries(raw.skills).map(([category, items]) => ({
      category,
      suggested: Array.isArray(items) ? items : extractSkillArray(items),
      reason: ""
    }));
  }

  return {
    summary: {
      suggested: extractSuggestedText(raw.summary, resume.summary || ""),
      reason: raw.summary?.reason || ""
    },
    skills,
    experience: (raw.experience || []).map((entry: any) => ({
      companyName: entry.companyName,
      points: (entry.points || []).map((point: any) => ({
        suggested: extractSuggestedText(point),
        reason: point?.reason || ""
      })),
      skillsUsed: {
        suggested: extractSkillArray(entry.skillsUsed?.suggested ?? entry.skillsUsed),
        reason: entry.skillsUsed?.reason || ""
      }
    })),
    projects: (raw.projects || []).map((project: any) => ({
      name: project.name,
      about: {
        suggested: extractSuggestedText(project.about),
        reason: project.about?.reason || ""
      },
      techStack: {
        suggested: extractSkillArray(project.techStack?.suggested ?? project.techStack),
        reason: project.techStack?.reason || ""
      }
    }))
  };
}

export function normalizeSuggestions(
  raw: any,
  resume: Resume,
  options: { skillWhitelist?: string[]; jobDescriptionText?: string } = {}
): Suggestions {
  const normalized = normalizeRawModelOutput(raw, resume);
  const sanitizeOptions = { whitelist: options.skillWhitelist || [], maxItems: MAX_VISIBLE_SKILLS };
  const jdTextLower = String(options.jobDescriptionText || "").toLowerCase();
  const suggestedSkillList = (suggested: SkillItem[], current: SkillItem[]) =>
    applyKeywordBold(ensureNonEmptySkillList(suggested, current, sanitizeOptions), jdTextLower);

  return {
    summary: {
      current: resume.summary || "",
      suggested: clampToLength(normalized.summary.suggested || resume.summary || "", resume.summary || ""),
      reason: normalized.summary.reason || ""
    },
    // Categories with zero real items in the master resume (still possible
    // if that category's data is genuinely empty) are skipped entirely
    // rather than emitted as a blank row - there's nothing truthful to
    // suggest for a category with no skills in it, and showing an empty row
    // just looks like a bug.
    skills: Object.entries(resume.skills || {})
      .filter(([, current]) => current.length > 0)
      .map(([category, current]) => {
        const match = (normalized.skills || []).find((item: any) => item.category === category) || {};
        return {
          category,
          // Displayed "current" is capped to the same MAX_VISIBLE_SKILLS the
          // resume template actually renders (see renderTokenList in
          // templates/render.ts) - showing the full master category here
          // (which can hold 20+ items) made rows wildly inconsistent in
          // length and didn't match what the preview panel shows.
          current: clone(current.slice(0, MAX_VISIBLE_SKILLS)),
          suggested: suggestedSkillList(match.suggested || current, current),
          reason: match.reason || ""
        };
      }),
    experience: (resume.experience || []).map((item) => {
      const match = (normalized.experience || []).find((entry: any) => entry.companyName === item.companyName) || {};
      const pointMatches = Array.isArray(match.points) ? match.points : [];
      return {
        companyName: item.companyName,
        role: item.role,
        points: (item.points || []).map((point, index) => {
          const pointMatch = pointMatches[index] || pointMatches.find((entry: any) => entry.current === point) || {};
          return {
            current: point,
            suggested: clampToLength(pointMatch.suggested || point, point),
            reason: pointMatch.reason || ""
          };
        }),
        skillsUsed: {
          current: clone((item.skillsUsed || []).slice(0, MAX_VISIBLE_SKILLS)),
          suggested: suggestedSkillList(match.skillsUsed?.suggested || item.skillsUsed || [], item.skillsUsed || []),
          reason: match.skillsUsed?.reason || ""
        }
      };
    }),
    projects: (resume.projects || []).map((item) => {
      const match = (normalized.projects || []).find((entry: any) => entry.name === item.name) || {};
      return {
        name: item.name,
        about: {
          current: item.about || "",
          suggested: clampToLength(match.about?.suggested || item.about || "", item.about || ""),
          reason: match.about?.reason || ""
        },
        techStack: {
          current: clone((item.techStack || []).slice(0, MAX_VISIBLE_SKILLS)),
          suggested: suggestedSkillList(match.techStack?.suggested || item.techStack || [], item.techStack || []),
          reason: match.techStack?.reason || ""
        }
      };
    })
  };
}

export function createDefaultReviewSelections(suggestions: Suggestions): ReviewSelections {
  const selections: ReviewSelections = {
    summary: "pending",
    skills: {},
    experience: {},
    projects: {}
  };

  for (const skill of suggestions.skills || []) {
    selections.skills[skill.category] = "pending";
  }

  (suggestions.experience || []).forEach((entry, experienceIndex) => {
    selections.experience[experienceIndex] = {
      all: "pending",
      points: entry.points.map(() => "pending"),
      skillsUsed: "pending"
    };
  });

  (suggestions.projects || []).forEach((_project, projectIndex) => {
    selections.projects[projectIndex] = {
      all: "pending",
      about: "pending",
      techStack: "pending"
    };
  });

  return selections;
}

export function setSectionSelection(
  selections: ReviewSelections,
  section: "summary" | "skills" | "experience" | "projects",
  value: SelectionState
): ReviewSelections {
  const next = clone(selections);

  if (section === "summary") {
    next.summary = value;
    return next;
  }
  if (section === "skills") {
    for (const key of Object.keys(next.skills)) {
      next.skills[key] = value;
    }
    return next;
  }
  if (section === "experience") {
    for (const entry of Object.values(next.experience) as ExperienceSelection[]) {
      entry.all = value;
      entry.points = entry.points.map(() => value);
      entry.skillsUsed = value;
    }
    return next;
  }
  if (section === "projects") {
    for (const entry of Object.values(next.projects) as ProjectSelection[]) {
      entry.all = value;
      entry.about = value;
      entry.techStack = value;
    }
  }
  return next;
}

export function applyAcceptedChanges(baseResume: Resume, suggestions: Suggestions, selections: ReviewSelections): Resume {
  const next = clone(baseResume);

  if (selections.summary === "accepted") {
    next.summary = suggestions.summary.suggested;
  }

  for (const skillGroup of suggestions.skills || []) {
    if (selections.skills?.[skillGroup.category] === "accepted") {
      next.skills[skillGroup.category] = clone(skillGroup.suggested);
    }
  }

  (suggestions.experience || []).forEach((entry, experienceIndex) => {
    const state = selections.experience?.[experienceIndex];
    if (!state) {
      return;
    }
    entry.points.forEach((point, pointIndex) => {
      if (state.points?.[pointIndex] === "accepted") {
        next.experience[experienceIndex].points[pointIndex] = point.suggested;
      }
    });
    if (state.skillsUsed === "accepted") {
      next.experience[experienceIndex].skillsUsed = clone(entry.skillsUsed.suggested);
    }
  });

  (suggestions.projects || []).forEach((project, projectIndex) => {
    const state = selections.projects?.[projectIndex];
    if (!state) {
      return;
    }
    if (state.about === "accepted") {
      next.projects[projectIndex].about = project.about.suggested;
    }
    if (state.techStack === "accepted") {
      next.projects[projectIndex].techStack = clone(project.techStack.suggested);
    }
  });

  return next;
}
