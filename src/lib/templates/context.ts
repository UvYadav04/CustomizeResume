import { escapeHtml } from "../utils";
import type { Resume, ResumeLink } from "../types";

// Joins links with a "|" separator BETWEEN them (never a leading/trailing
// one) - built here as ready-to-insert raw HTML because the mini-template
// engine's {{#each}} has no built-in "join" concept, so a plain each-loop
// over links can't put a separator between items without also putting one
// after the last item (or needing one before the first).
function renderLinksHtml(links: ResumeLink[] = []): string {
  return links
    .map((link) => `<a href="${escapeHtml(link.url)}" target="_blank" rel="noreferrer">${escapeHtml(link.label)}</a>`)
    .join('<span class="rt-contact-sep">|</span>');
}

// Converts the structured Resume type into a flat, logic-free context object
// for the mini-template engine. All conditionals ("does this project have a
// tech stack?", "split the project name on an em dash") are computed here so
// the HTML template itself never needs expressions - just {{field}},
// {{#each list}}, and {{#if flag}}.
//
// Hard cap: never render more than 7 skills per row, matching the same
// MAX_VISIBLE_SKILLS in resume-utils.ts. lib/skillLineFit.ts's
// trimSkillRowsToOneLine() can still cut this down further at render time
// (removing whatever wraps past the first line for a category with long
// skill names), but it will never show more than this number even if more
// would technically fit on the line.
const MAX_VISIBLE_SKILLS = 7;

// Header contact info renders as two separate lines so it never overflows
// the page width: line 1 is the links (GitHub, Portfolio, LinkedIn,
// LeetCode, ...), line 2 is email | phone | location. Each is built as
// ready-to-insert raw HTML, joining only the parts that actually exist with
// "|" between them (never a leading/trailing one), inserted via
// {{&contactLinksHtml}} / {{&contactDetailsHtml}} (raw, unescaped - the
// pieces are already escaped here).
function renderContactLinksLine(resume: Resume): string {
  return renderLinksHtml(resume.contact?.links || []);
}

function renderContactDetailsLine(resume: Resume): string {
  const contact = resume.contact || {};
  const parts: string[] = [];
  if (contact.email) {
    parts.push(`<a href="mailto:${escapeHtml(contact.email)}">${escapeHtml(contact.email)}</a>`);
  }
  if (contact.phone) {
    parts.push(`<span>${escapeHtml(contact.phone)}</span>`);
  }
  if (contact.location) {
    parts.push(`<span>${escapeHtml(contact.location)}</span>`);
  }
  return parts.join('<span class="rt-contact-sep">|</span>');
}

export function buildTemplateContext(resume: Resume) {
  return {
    name: resume.name || "",
    summary: resume.summary || "",
    email: resume.contact?.email || "",
    phone: resume.contact?.phone || "",
    location: resume.contact?.location || "",
    hasEmail: Boolean(resume.contact?.email),
    hasPhone: Boolean(resume.contact?.phone),
    hasLocation: Boolean(resume.contact?.location),
    hasLinks: Boolean(resume.contact?.links?.length),
    links: resume.contact?.links || [],
    hasContactLinks: Boolean(resume.contact?.links?.length),
    contactLinksHtml: renderContactLinksLine(resume),
    hasContactDetails: Boolean(resume.contact?.email || resume.contact?.phone || resume.contact?.location),
    contactDetailsHtml: renderContactDetailsLine(resume),
    skillCategories: Object.entries(resume.skills || {}).map(([category, items]) => ({
      category,
      items: (items || []).slice(0, MAX_VISIBLE_SKILLS).map((item) => ({ name: item.name, bold: Boolean(item.bold) }))
    })),
    experience: (resume.experience || []).map((item) => ({
      companyName: item.companyName || "",
      role: item.role || "",
      duration: item.duration || "",
      location: item.location || "",
      hasLocation: Boolean(item.location),
      points: (item.points || []).map((text) => ({ text })),
      hasSkillsUsed: Boolean(item.skillsUsed?.length),
      skillsUsed: (item.skillsUsed || []).slice(0, MAX_VISIBLE_SKILLS).map((s) => ({ name: s.name, bold: Boolean(s.bold) }))
    })),
    projects: (resume.projects || []).map((item) => {
      const [main, secondary] = (item.name || "").split("—");
      return {
        name: item.name || "",
        nameMain: (main || "").trim(),
        nameSecondary: (secondary || "").trim(),
        hasSecondaryName: Boolean(secondary && secondary.trim()),
        about: item.about || "",
        links: item.links || [],
        linksHtml: renderLinksHtml(item.links || []),
        hasLinks: Boolean(item.links?.length),
        hasTechStack: Boolean(item.techStack?.length),
        techStack: (item.techStack || []).slice(0, MAX_VISIBLE_SKILLS).map((s) => ({ name: s.name, bold: Boolean(s.bold) }))
      };
    }),
    education: (resume.education || []).map((item) => ({
      institution: item.institution || "",
      degree: item.degree || "",
      duration: item.duration || "",
      location: item.location || "",
      score: item.score || "",
      hasScore: Boolean(item.score),
      hasCoursework: Boolean(item.coursework?.length),
      courseworkJoined: (item.coursework || []).join(", ")
    }))
  };
}

export type TemplateContext = ReturnType<typeof buildTemplateContext>;
