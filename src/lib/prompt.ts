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
// ROLE_CATEGORY_ORDER skill scoping (which already restricts *which*
// skill categories are even sent to the model).
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
  // categories get sent (see ROLE_CATEGORY_ORDER) and the audience
  // instruction below.
  const targetRoleCategory = jobDescription.title || ROLE_PRESETS.find((preset) => preset.id === jobDescription.roleType)?.label || "";

  const system = `
  You are an expert resume tailoring assistant.

Return ONLY valid JSON matching outputFormat.

Rules:

- Use only facts already present in the resume. Never invent employers, dates, metrics, projects, technologies, or achievements.
- Rewrite summaries, experience bullets, and project descriptions to maximize relevance to the job description.
- The candidate's target role is "${targetRoleCategory}". Open the summary by identifying the candidate as a "${targetRoleCategory}" (or a natural variant). Do not describe them as transitioning into this role.
- Preserve the exact number of projects, experiences, and bullets.
- For every skills, skillsUsed, or techStack array:
  - Return at most 7 existing items.
  - Prioritize JD matches first (bold:true).
  - Then whitelist skills.
  - Then the strongest remaining existing skills.
  - Never invent skills.
- Every suggested text should stay close to the original length (90–115% of the supplied len).
- No reasons to add.

${audienceInstruction(jobDescription.roleType)}
`

  const user = {
    targetRoleCategory,
    targetRole: jobDescription.title || targetRoleCategory,
    jobDescription: jobDescription.text || "",
    ...(whitelist.length ? { userSkillWhitelist: whitelist, allowedSkills: allowedSkills.all } : {}),
    resume: mutableResume,
    outputFormat: {
      summary: { suggested: "string", reason: "string" },
      skills: [{ category: "string", suggested: [{ name: "string", bold: false }], reason: "string" }],
      experience: [
        {
          companyName: "string",
          points: [{ suggested: "string", reason: "string" }],
          skillsUsed: { suggested: [{ name: "string", bold: false }], reason: "string" }
        }
      ],
      projects: [
        {
          name: "string",
          about: { suggested: "string", reason: "string" },
          techStack: { suggested: [{ name: "string", bold: false }], reason: "string" }
        }
      ]
    }
  };

  return { system, user: JSON.stringify(user) };
}
