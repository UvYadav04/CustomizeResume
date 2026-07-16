// Runs AFTER the resume HTML has been laid out in a real DOM (either the
// live preview iframe or the offscreen container used for PDF export) and
// trims each skill row down to only what actually fits on its first line.
//
// Why this exists: skill category labels vary a lot in length ("Backend:"
// vs "AI Systems & Architecture:"), and so do skill names. A fixed count
// like "always show 5" either overflows a line for a category with long
// names, or leaves a short-named category looking sparse. Rather than
// guess at a character budget, this measures the real rendered position of
// each skill token: everything on the same line as the first token stays,
// anything that wrapped to a second line (higher offsetTop) gets removed.
// The upstream pipeline already sends more candidates than could ever fit
// on one line (see MAX_VISIBLE_SKILLS in resume-utils.ts /
// templates/context.ts), ordered most-to-least relevant, so trimming from
// the end is always safe - nothing important gets cut before something
// less relevant.
export function trimSkillRowsToOneLine(root: Document | HTMLElement): void {
  const rows = root.querySelectorAll<HTMLElement>(".rt-skill-row, .rt-tech-line");

  rows.forEach((row) => {
    const tokens = Array.from(row.querySelectorAll<HTMLElement>(".rt-token"));
    if (tokens.length < 2) {
      return;
    }
    const firstLineTop = tokens[0].offsetTop;
    for (const token of tokens) {
      if (token.offsetTop > firstLineTop) {
        token.remove();
      }
    }
  });
}
