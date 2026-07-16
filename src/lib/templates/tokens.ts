import type { ResumeTemplate } from "../types";

// Plain color values pulled out of a template's CSS text (see
// templates/index.ts's *_TOKENS strings) for use by the native PDF renderer
// (lib/pdf.ts), which draws directly with jsPDF and has no CSS/DOM to read
// custom properties from. Kept as a thin reader over the existing CSS
// strings rather than a second, separately-maintained source of truth -
// change a template's colors in templates/index.ts and both the on-screen
// preview and the downloaded PDF pick it up.
export interface TemplateColorTokens {
  ink: string;
  muted: string;
  faint: string;
  accent: string;
  rule: string;
}

const FALLBACK: TemplateColorTokens = {
  ink: "#1a1c22",
  muted: "#565d68",
  faint: "#8a909a",
  accent: "#0f5257",
  rule: "#c9ced4"
};

export function getTemplateColorTokens(template: ResumeTemplate): TemplateColorTokens {
  const css = template.styles || "";
  const read = (name: keyof TemplateColorTokens): string => {
    const match = css.match(new RegExp(`--rt-${name}:\\s*([^;]+);`));
    return match ? match[1].trim() : FALLBACK[name];
  };
  return {
    ink: read("ink"),
    muted: read("muted"),
    faint: read("faint"),
    accent: read("accent"),
    rule: read("rule")
  };
}
