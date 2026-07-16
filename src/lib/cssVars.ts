// Resolves CSS custom properties (var(--rt-ink) etc.) down to their literal
// values before handing markup to html2canvas.
//
// Why this exists: html2canvas renders by reading computed styles and
// redrawing them onto a <canvas> - it does NOT get a real browser paint of
// the page. Its support for CSS custom properties has historically been
// incomplete/version-dependent, and our templates lean on `:root { --rt-*: ... }`
// tokens for every color and font everywhere (see templates/index.ts). If
// html2canvas fails to resolve even one of those (e.g. text color), the
// result can be a page that's structurally correct but visually blank -
// exactly "pure white, no content" with nothing obviously wrong in the DOM.
// Inlining every var(--x) to its literal value before the CSS ever reaches
// html2canvas removes this whole class of failure, independent of whatever
// version quirks html2canvas has.
export function inlineCssVariables(css: string): string {
  const varMap: Record<string, string> = {};

  // Our templates only ever declare custom properties in a single
  // `:root { ... }` block at the top of their styles, but this handles
  // multiple such blocks defensively.
  const rootBlockRe = /:root\s*\{([^}]*)\}/g;
  let rootMatch: RegExpExecArray | null;
  while ((rootMatch = rootBlockRe.exec(css))) {
    for (const decl of rootMatch[1].split(";")) {
      const declMatch = decl.match(/^\s*(--[\w-]+)\s*:\s*(.+?)\s*$/);
      if (declMatch) {
        varMap[declMatch[1]] = declMatch[2];
      }
    }
  }

  const varUsageRe = /var\(\s*(--[\w-]+)\s*(?:,\s*([^)]+))?\)/g;
  let result = css;

  // A couple of passes in case a resolved value itself contains var(...)
  // (not currently true for our templates, but harmless to guard against).
  for (let pass = 0; pass < 3; pass++) {
    let changedAny = false;
    result = result.replace(varUsageRe, (fullMatch, name, fallback) => {
      if (varMap[name] !== undefined) {
        changedAny = true;
        return varMap[name];
      }
      if (fallback !== undefined) {
        changedAny = true;
        return fallback.trim();
      }
      return fullMatch;
    });
    if (!changedAny) break;
  }

  return result;
}
