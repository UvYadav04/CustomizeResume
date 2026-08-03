import { clone, sanitizeSkillList } from "./utils";
import { ROLE_SKILL_LAYOUTS } from "./constants";
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

// Index of every master skill by lowercased name, used below to carry over
// an existing bold flag when a role layout references a skill the person
// has already bolded in the master list - otherwise every role-scoped skill
// would reset to unbolded on every switch.
function flattenSkillsByName(skills: Record<string, SkillItem[]> = {}): Map<string, SkillItem> {
  const map = new Map<string, SkillItem>();
  for (const items of Object.values(skills)) {
    for (const item of items || []) {
      map.set(item.name.toLowerCase(), item);
    }
  }
  return map;
}

// Replaces resume.skills with the chosen role's fully curated category set
// (see ROLE_SKILL_LAYOUTS) - self-contained literal skill lists per role,
// not filtered/merged from the master pool, since each role tells its own
// story and the same skill can legitimately appear in several different
// roles' lists. No pre-trimming happens here - the whole point is to hand
// the model the complete candidate pool per category at generate() time and
// let it pick the best 5-6 based on the job description (see prompt.ts).
// Falls back to the untouched master skill set for any roleType without an
// explicit layout.
export function buildRoleScopedResume(resume: Resume, roleType: string): Resume {
  const next = clone(resume);
  const layout = ROLE_SKILL_LAYOUTS[roleType];
  if (!layout) {
    return next;
  }

  const masterIndex = flattenSkillsByName(resume.skills);
  const scopedSkills: Record<string, SkillItem[]> = {};
  for (const category of layout) {
    scopedSkills[category.label] = category.skills.map((name) => ({
      name,
      bold: Boolean(masterIndex.get(name.toLowerCase())?.bold)
    }));
  }
  next.skills = scopedSkills;
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
// (the largest, "Backend Development", has under 20) so the model
// genuinely sees everything real it could choose from.
const MAX_CANDIDATE_SKILLS_PER_ARRAY = 30;

// Bullet text (experience/project points) is deliberately never sent to the
// model - bullets are never rewritten (see prompt.ts / normalizeSuggestions,
// which now hard-forces suggested === current for every bullet), so shipping
// that text to the model would just be wasted tokens for output that's
// thrown away anyway. Only what the model actually acts on goes out: the
// summary, the full skills candidate pool, and each entry's small curated
// skillsUsed/techStack list (for bolding JD matches).
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
      skillsUsed: withSkillArray(item.skillsUsed || []).slice(0, MAX_CANDIDATE_SKILLS_PER_ARRAY)
    })),
    projects: (resume.projects || []).map((item) => ({
      name: item.name,
      techStack: withSkillArray(item.techStack || []).slice(0, MAX_CANDIDATE_SKILLS_PER_ARRAY)
    }))
  };
}

function ensureNonEmptySkillList(
  suggested: SkillItem[],
  current: SkillItem[],
  sanitizeOptions: { whitelist: string[]; maxItems: number; pad?: boolean }
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
    // Models occasionally misspell the key (seen in the wild: "sugagested").
    // Rather than silently falling back to the unchanged original text (which
    // looks, from the review panel, like "nothing happened"), take the first
    // remaining string-valued field that isn't "reason" - reliable in
    // practice since outputFormat only ever has one text field plus "reason"
    // per object.
    for (const [key, entry] of Object.entries(value)) {
      if (key !== "reason" && typeof entry === "string") {
        return entry;
      }
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
  // Same typo tolerance as extractSuggestedText - fall back to the first
  // array-valued field on the object (e.g. a misspelled "suggested" key)
  // instead of silently returning an empty list.
  if (value && typeof value === "object") {
    for (const entry of Object.values(value)) {
      if (Array.isArray(entry)) {
        return entry as SkillItem[];
      }
    }
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
    // Bullet points are never requested from or applied from the model
    // anymore (see getMutableResumePayload / normalizeSuggestions) - only
    // skillsUsed/techStack are parsed out of each entry here.
    experience: (raw.experience || []).map((entry: any) => ({
      companyName: entry.companyName,
      skillsUsed: {
        suggested: extractSkillArray(entry.skillsUsed?.suggested ?? entry.skillsUsed),
        reason: entry.skillsUsed?.reason || ""
      }
    })),
    projects: (raw.projects || []).map((project: any) => ({
      name: project.name,
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
  // `pad` distinguishes the two shapes of skill list in play here (see the
  // comment on sanitizeSkillList in utils.ts): the master Skills section
  // hands the model a large, intentionally untrimmed pool and wants a real
  // narrowed-down pick with no top-up (pad: false), while an experience's
  // skillsUsed / a project's techStack is already a small curated list
  // where topping back up to MAX_VISIBLE_SKILLS from that same short list
  // is exactly the desired "keep almost all of it" behavior (pad: true).
  const suggestedSkillList = (suggested: SkillItem[], current: SkillItem[], pad = true) =>
    applyKeywordBold(ensureNonEmptySkillList(suggested, current, { ...sanitizeOptions, pad }), jdTextLower);

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
          suggested: suggestedSkillList(match.suggested || current, current, false),
          reason: match.reason || ""
        };
      }),
    experience: (resume.experience || []).map((item) => {
      const match = (normalized.experience || []).find((entry: any) => entry.companyName === item.companyName) || {};
      return {
        companyName: item.companyName,
        role: item.role,
        // Experience bullets are never rewritten by the model (see prompt.ts) -
        // suggested is forced to equal current here too, as a hard guarantee
        // that holds even if a model ignores that instruction.
        points: (item.points || []).map((point) => ({
          current: point,
          suggested: point,
          reason: ""
        })),
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
        // Project bullets are never rewritten by the model (see prompt.ts) -
        // suggested is forced to equal current here too, as a hard guarantee
        // that holds even if a model ignores that instruction.
        points: (item.points || []).map((point) => ({
          current: point,
          suggested: point,
          reason: ""
        })),
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

  (suggestions.projects || []).forEach((project, projectIndex) => {
    selections.projects[projectIndex] = {
      all: "pending",
      points: project.points.map(() => "pending"),
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
      entry.points = entry.points.map(() => value);
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
    project.points.forEach((point, pointIndex) => {
      if (state.points?.[pointIndex] === "accepted") {
        next.projects[projectIndex].points[pointIndex] = point.suggested;
      }
    });
    if (state.techStack === "accepted") {
      next.projects[projectIndex].techStack = clone(project.techStack.suggested);
    }
  });

  return next;
}
