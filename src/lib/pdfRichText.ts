import type { jsPDF } from "jspdf";

// Resume text uses "**word**" to mark emphasis (see formatTextWithBoldMarkers
// in utils.ts, used for the HTML/live-preview path). The native PDF renderer
// (pdf.ts) draws real text directly with jsPDF, so it needs its own
// wrap+draw logic that understands those markers and renders the bold runs
// in bold weight + the accent color - matching the `strong, .is-bold` rule
// in templates/render.ts's shared CSS.
export interface TextRun {
  text: string;
  bold: boolean;
}

interface Word {
  text: string;
  bold: boolean;
}

function parseBoldRuns(raw: string): TextRun[] {
  const runs: TextRun[] = [];
  const re = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(raw))) {
    if (match.index > lastIndex) {
      runs.push({ text: raw.slice(lastIndex, match.index), bold: false });
    }
    runs.push({ text: match[1], bold: true });
    lastIndex = re.lastIndex;
  }
  if (lastIndex < raw.length) {
    runs.push({ text: raw.slice(lastIndex), bold: false });
  }
  return runs;
}

function runsToWords(runs: TextRun[]): Word[] {
  const words: Word[] = [];
  for (const run of runs) {
    for (const token of run.text.split(/\s+/)) {
      if (token) words.push({ text: token, bold: run.bold });
    }
  }
  return words;
}

// Wraps "**bold**"-marked text into lines that fit maxWidth (mm), given the
// font already sized via doc.setFontSize(sizePt) by the caller. Bold vs
// normal words are measured with their real weight, since bold glyphs are
// usually a little wider.
export function wrapRichText(doc: jsPDF, raw: string, maxWidth: number, font: string): Word[][] {
  const words = runsToWords(parseBoldRuns(raw));
  if (!words.length) return [];

  doc.setFont(font, "normal");
  const spaceWidth = doc.getTextWidth(" ");

  const lines: Word[][] = [];
  let current: Word[] = [];
  let currentWidth = 0;

  for (const word of words) {
    doc.setFont(font, word.bold ? "bold" : "normal");
    const wordWidth = doc.getTextWidth(word.text);
    const addWidth = current.length ? spaceWidth + wordWidth : wordWidth;

    if (current.length && currentWidth + addWidth > maxWidth) {
      lines.push(current);
      current = [word];
      currentWidth = wordWidth;
    } else {
      current.push(word);
      currentWidth += addWidth;
    }
  }
  if (current.length) lines.push(current);
  return lines;
}

// Draws one already-wrapped line of words at (x, y) (y = text baseline),
// switching weight/color per word so bold runs come out bold + accent-
// colored, matching the HTML template's <strong>/.is-bold styling.
export function drawRichLine(
  doc: jsPDF,
  words: Word[],
  x: number,
  y: number,
  font: string,
  colors: { normal: string; bold: string }
): void {
  let cx = x;
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    doc.setFont(font, word.bold ? "bold" : "normal");
    doc.setTextColor(word.bold ? colors.bold : colors.normal);
    doc.text(word.text, cx, y);
    cx += doc.getTextWidth(word.text);
    if (i < words.length - 1) {
      doc.setFont(font, "normal");
      cx += doc.getTextWidth(" ");
    }
  }
}

// Convenience: wrap + draw in one call, returning the height (mm) consumed.
export function drawWrappedRichText(
  doc: jsPDF,
  raw: string,
  x: number,
  y: number,
  maxWidth: number,
  font: string,
  colors: { normal: string; bold: string },
  lineHeightMm: number
): number {
  const lines = wrapRichText(doc, raw, maxWidth, font);
  lines.forEach((line, index) => {
    drawRichLine(doc, line, x, y + index * lineHeightMm, font, colors);
  });
  return lines.length * lineHeightMm;
}

export function measureWrappedLineCount(doc: jsPDF, raw: string, maxWidth: number, font: string, sizePt: number): number {
  doc.setFontSize(sizePt);
  return Math.max(1, wrapRichText(doc, raw, maxWidth, font).length);
}
