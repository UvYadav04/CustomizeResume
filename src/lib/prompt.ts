import { getMutableResumePayload } from "./resume-utils";
import type { JobDescription, Resume, Settings } from "./types";
import { ROLE_PRESETS, roleAudience } from "./constants";

function buildAllowedSkillCatalog(resume: Resume, whitelist: string[] = []) {
  const allowedWhitelist = new Set(whitelist.map((item) => item.toLowerCase().trim()).filter(Boolean));
  const isAllowed = (name: string) => !allowedWhitelist.size || allowedWhitelist.has(name.toLowerCase().trim());
  const flat: string[] = [];
  for (const items of Object.values(resume.skills || {})) {
    flat.push(...items.map((item) => item.name).filter(isAllowed));
  }
  for (const experience of resume.experience || []) {
    flat.push(...(experience.skillsUsed || []).map((item) => item.name).filter(isAllowed));
  }
  for (const project of resume.projects || []) {
    flat.push(...(project.techStack || []).map((item) => item.name).filter(isAllowed));
  }
  return { all: Array.from(new Set(flat)) };
}

// Role-specific term emphasis: AI roles get an instruction to lean into
// AI/ML vocabulary, SDE roles get an instruction to lean into core software
// engineering vocabulary. This is layered on top of the existing
// ROLE_SKILL_LAYOUTS skill scoping (which already restricts *which*
// skill categories - and every candidate skill within them - are even sent
// to the model).
function audienceInstruction(roleType: string): string {
  const audience = roleAudience(roleType);
  if (audience === "ai") {
    return "- This is an AI/ML-focused role. Favor AI/GenAI vocabulary (LLMs, RAG, agents, embeddings, fine-tuning, evaluation, orchestration) wherever it is truthfully supported by the resume's existing content.";
  }
  if (audience === "sde") {
    return "- This is a core software engineering role, NOT an AI/ML role. Favor software engineering vocabulary (system design, APIs, databases, distributed systems, testing, performance). Do not foreground AI/GenAI/LLM terminology in the summary's opening framing - it may only appear afterward, briefly, as one supporting skill among others, and never as the headline identity.";
  }
  return "";
}

export function buildTailorPrompt(resume: Resume, jobDescription: JobDescription, settings: Settings) {
  const whitelist = settings.skillWhitelist || [];
  const allowedSkills = buildAllowedSkillCatalog(resume, whitelist);
  const mutableResume = getMutableResumePayload(resume);
  // The free-text job title is what the person actually typed for this
  // application (e.g. a specific posting's title like "Senior SWE II") and
  // takes priority for the summary's stated identity. The role-type dropdown
  // (e.g. "Full Stack Developer") is only a fallback category label used
  // when no job title was entered, plus it still scopes which skill
  // categories - and which full, untrimmed candidate pool per category -
  // get sent (see ROLE_SKILL_LAYOUTS) and the audience instruction below.
  const targetRoleCategory = jobDescription.title || ROLE_PRESETS.find((preset) => preset.id === jobDescription.roleType)?.label || "";

  // Structured as one block per output section (summary, skills, experience,
  // projects) instead of one flat rules list - each section states its own
  // task and constraints right where the model will apply them. The three
  // skill-shaped arrays (skills, skillsUsed, techStack) get genuinely
  // different instructions, not a shared block, because they're different
  // shapes of input: `skills` categories are a large, intentionally
  // untrimmed candidate pool (see ROLE_SKILL_LAYOUTS) that needs picking
  // DOWN to the best 5-6, whereas a single job's `skillsUsed` or a single
  // project's `techStack` is already a small, specific, pre-curated list (5-9
  // items) - there is usually nothing to trim, just JD-relevant items to
  // bold.
  const system = `
You are an expert resume tailoring assistant.

Return ONLY valid JSON matching outputFormat.

General rules (apply to every section below):
- Use only facts already present in the resume. Never invent employers, dates, metrics, projects, technologies, or achievements.
- Keep the underlying content exactly as written - what was built, what it does, the numbers, the tech - and only reframe wording/emphasis so it reads as relevant to the job description. Do not add new claims or change what actually happened.
- The candidate's target role is "${targetRoleCategory}". Do not describe them as transitioning into this role.
- Preserve the exact number of projects and experiences.
- No reasons to add.

${audienceInstruction(jobDescription.roleType)}

SUMMARY:
- Rewrite the summary to maximize relevance to the job description, using only facts already present elsewhere in the resume.
- Open by identifying the candidate as a "${targetRoleCategory}" (or a natural variant).
- Length: exactly 40-45 words.

SKILLS:
- Each category gives you the FULL candidate pool the person actually has for it - not a pre-filtered shortlist - so your job here is to narrow it down.
- Pick the 5-6 items per category that are the strongest match, prioritizing anything explicitly mentioned in the job description (bold:true).
- If fewer than 5 candidates are genuinely relevant, return fewer - do not pad with irrelevant ones.
- Never return more than 7 per category.
- Then prioritize whitelist skills, if any are provided.
- Never invent skills not present in that category's candidate pool.

EXPERIENCE:
- Bullet points are not part of this request and must not be touched anywhere else in the app - only skillsUsed is yours to work on here.
- skillsUsed is already the specific, curated tech stack for this one job - it is NOT a big pool to narrow down. Keep essentially all of it as-is; only bold the ones explicitly mentioned in the job description, and only drop an item if it is genuinely irrelevant filler. Never invent a technology that isn't already listed there.

PROJECTS:
- Bullet points are not part of this request and must not be touched anywhere else in the app - only techStack is yours to work on here.
- techStack is already the specific, curated tech stack for this one project - it is NOT a big pool to narrow down. Keep essentially all of it as-is; only bold the ones explicitly mentioned in the job description, and only drop an item if it is genuinely irrelevant filler. Never invent a technology that isn't already listed there.
`

  const user = {
    targetRoleCategory,
    targetRole: jobDescription.title || targetRoleCategory,
    jobDescription: jobDescription.text || "",
    ...(whitelist.length ? { userSkillWhitelist: whitelist, allowedSkills: allowedSkills.all } : {}),
    resume: mutableResume,
    outputFormat: {
      summary: { sugagested: "string", reason: "string" },
      skills: [{ category: "string", suggested: [{ name: "string", bold: false }], reason: "string" }],
      experience: [
        {
          companyName: "string",
          skillsUsed: { suggested: [{ name: "string", bold: false }], reason: "string" }
        }
      ],
      projects: [
        {
          name: "string",
          techStack: { suggested: [{ name: "string", bold: false }], reason: "string" }
        }
      ]
    }
  };

  return { system, user: JSON.stringify(user) };
}
