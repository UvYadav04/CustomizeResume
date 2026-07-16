import { BASE_TEMPLATE_STYLES } from "./render";
import { DEFAULT_RESUME_HTML } from "./defaultContent";
import { renderMiniTemplate } from "./engine";
import { buildTemplateContext } from "./context";
import type { Resume, ResumeTemplate, TemplateOverride } from "../types";

// Font import is loaded once at document level (see App.tsx) rather than
// per-template @import, since multiple templates may render side by side.
export const GOOGLE_FONTS_URL =
  "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Source+Sans+3:wght@400;500;600;700&family=Source+Serif+4:opsz,wght@8..60,500;8..60,600;8..60,700&family=Space+Grotesk:wght@500;600;700&display=swap";

const CLASSIC_TOKENS = `
:root {
  --rt-page-width: 210mm;
  --rt-page-height: 297mm;
  --rt-fs-name: 21pt;
  --rt-fs-section: 10.5pt;
  --rt-fs-entry: 10.5pt;
  --rt-fs-role: 9.5pt;
  --rt-fs-body: 9.2pt;
  --rt-fs-skill: 8.8pt;
  --rt-fs-meta: 8.4pt;
  --rt-ink: #1a1c22;
  --rt-muted: #565d68;
  --rt-faint: #8a909a;
  --rt-accent: #0f5257;
  --rt-rule: #c9ced4;
  --rt-rule-soft: #e6e9ec;
  --rt-page: #ffffff;
  --rt-serif: "Source Serif 4", Georgia, "Times New Roman", serif;
  --rt-sans: "Source Sans 3", -apple-system, "Segoe UI", Roboto, sans-serif;
  --rt-mono: "IBM Plex Mono", "SFMono-Regular", Menlo, Consolas, monospace;
}
`;

// AI-role variant. Previously had an indigo/purple accent (#4338ca) and led
// with the geometric "Space Grotesk" for the name - swapped both out per
// request: name now uses the same professional serif stack as the
// extension's own template (Source Serif 4), and the accent is the
// extension's actual accent color (a blue-leaning teal), not a new color.
const AI_FOCUSED_TOKENS = `
:root {
  --rt-page-width: 210mm;
  --rt-page-height: 297mm;
  --rt-fs-name: 21pt;
  --rt-fs-section: 10.5pt;
  --rt-fs-entry: 10.5pt;
  --rt-fs-role: 9.5pt;
  --rt-fs-body: 9.2pt;
  --rt-fs-skill: 8.8pt;
  --rt-fs-meta: 8.4pt;
  --rt-ink: #1b1d2b;
  --rt-muted: #565a72;
  --rt-faint: #8b8fa8;
  --rt-accent: #0f5257;
  --rt-rule: #c9ced4;
  --rt-rule-soft: #e6e9ec;
  --rt-page: #ffffff;
  --rt-serif: "Source Serif 4", Georgia, "Times New Roman", serif;
  --rt-sans: "Source Sans 3", -apple-system, "Segoe UI", Roboto, sans-serif;
  --rt-mono: "IBM Plex Mono", "SFMono-Regular", Menlo, Consolas, monospace;
}
`;

// SDE-role variant: dense, slate/green accent evoking a terminal/
// engineering feel. The name previously forced monospace via an
// !important override - switched to the same professional serif as the
// other templates so the name reads consistently across all three.
const SDE_FOCUSED_TOKENS = `
:root {
  --rt-page-width: 210mm;
  --rt-page-height: 297mm;
  --rt-fs-name: 20pt;
  --rt-fs-section: 10pt;
  --rt-fs-entry: 10.2pt;
  --rt-fs-role: 9.3pt;
  --rt-fs-body: 9pt;
  --rt-fs-skill: 8.6pt;
  --rt-fs-meta: 8.2pt;
  --rt-ink: #17211d;
  --rt-muted: #4c5c55;
  --rt-faint: #869088;
  --rt-accent: #0a6e4f;
  --rt-rule: #cbd8d1;
  --rt-rule-soft: #e6ede9;
  --rt-page: #ffffff;
  --rt-serif: "Source Serif 4", Georgia, "Times New Roman", serif;
  --rt-sans: "Source Sans 3", -apple-system, "Segoe UI", Roboto, sans-serif;
  --rt-mono: "IBM Plex Mono", "SFMono-Regular", Menlo, Consolas, monospace;
}
`;

export const BUILT_IN_TEMPLATES: ResumeTemplate[] = [
  {
    id: "single-column-classic",
    label: "Classic",
    description: "Balanced serif/sans single-column layout. Works for any role.",
    audience: "general",
    styles: CLASSIC_TOKENS + BASE_TEMPLATE_STYLES,
    defaultHtml: DEFAULT_RESUME_HTML
  },
  {
    id: "ai-focused",
    label: "AI Engineer",
    description: "Blue-teal accent, professional serif name. Tuned for AI/ML roles.",
    audience: "ai",
    styles: AI_FOCUSED_TOKENS + BASE_TEMPLATE_STYLES,
    defaultHtml: DEFAULT_RESUME_HTML
  },
  {
    id: "sde-focused",
    label: "Software Engineer",
    description: "Dense layout, slate/green accent. Tuned for SDE roles.",
    audience: "sde",
    styles: SDE_FOCUSED_TOKENS + BASE_TEMPLATE_STYLES,
    defaultHtml: DEFAULT_RESUME_HTML
  }
];

export function getTemplates(): ResumeTemplate[] {
  return BUILT_IN_TEMPLATES;
}

export function getTemplateById(templateId: string): ResumeTemplate {
  return BUILT_IN_TEMPLATES.find((template) => template.id === templateId) || BUILT_IN_TEMPLATES[0];
}

// Picks the template whose `audience` matches the role preset, falling back
// to whatever template is currently selected in Settings if the audience is
// "general" or unrecognized. This is what makes role selection in the form
// panel actually swap the visual template, not just the prompt content.
export function getTemplateForRole(roleAudience: "ai" | "sde" | "general", fallbackTemplateId: string): ResumeTemplate {
  if (roleAudience === "ai") {
    return getTemplateById("ai-focused");
  }
  if (roleAudience === "sde") {
    return getTemplateById("sde-focused");
  }
  return getTemplateById(fallbackTemplateId);
}

// settings.templateId is either a concrete template id or the sentinel
// "auto", which means "pick automatically based on the selected role".
export function resolveTemplate(templateId: string, roleAudience: "ai" | "sde" | "general"): ResumeTemplate {
  if (templateId === "auto") {
    return getTemplateForRole(roleAudience, "single-column-classic");
  }
  return getTemplateById(templateId);
}

// Applies a saved per-template override (from Settings > Templates, only
// written once someone clicks Save) on top of the built-in defaults, then
// renders it through the mini-template engine. This is the single place
// both the live preview and the PDF export should go through.
export function renderTemplateWithOverride(
  template: ResumeTemplate,
  resume: Resume,
  override?: TemplateOverride
): { html: string; css: string } {
  const htmlSource = override?.html || template.defaultHtml;
  const css = override?.css || template.styles;
  const html = renderMiniTemplate(htmlSource, buildTemplateContext(resume));
  return { html, css };
}
