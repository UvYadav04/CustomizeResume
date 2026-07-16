import jsPDF from "jspdf";
import type { Resume, ResumeLink, ResumeTemplate, SkillItem } from "./types";
import { getTemplateColorTokens } from "./templates/tokens";
import { drawWrappedRichText, measureWrappedLineCount } from "./pdfRichText";

// Renders the resume directly with jsPDF's native text APIs - real,
// selectable, ATS-parseable text and real embedded links, not a rasterized
// image of the HTML preview.
//
// This replaces an earlier html2canvas-based approach (render the HTML
// preview to a <canvas>, embed that as a JPEG in the PDF) that kept hitting
// the same class of bug no matter how it was patched: blank pages, section
// dividers cutting through text, bullet dots not lining up with their own
// paragraph. The common root cause was that html2canvas doesn't ask the
// browser to lay out and paint text - it re-implements text layout itself
// with approximate font metrics, so its raster output never quite matched
// what our own measurements (or the live preview) showed, and worse, the
// output was just a picture of text, not text - it couldn't be selected,
// copied, or read by an ATS parser at all. Drawing directly with jsPDF's
// text/line APIs sidesteps all of that: what's measured is what's drawn.
//
// Trade-off worth knowing: this reads structured resume data + a template's
// color tokens (templates/tokens.ts), not the editable HTML/CSS from
// Settings > Templates - a custom HTML/CSS override there now only affects
// the on-screen preview, not the downloaded PDF.
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const MARGIN_X = 13;
const MARGIN_TOP = 0;
const MARGIN_BOTTOM = 10;
const CONTENT_W = A4_WIDTH_MM - MARGIN_X * 2;
const PT_TO_MM = 0.352778;

const FS_NAME = 21;
const FS_SECTION = 10.5;
const FS_ENTRY = 10.5;
const FS_ROLE = 9.5;
const FS_BODY = 9.2;
const FS_SKILL = 8.8;
const FS_META = 8.4;
const FS_CONTACT = 8.8;

const MAX_ROW_SKILLS = 7;

const BULLET_INDENT = 4.2;
const BULLET_DOT_R = 0.5;

interface Cursor {
  y: number;
}

function lh(sizePt: number, mult = 1.35): number {
  return sizePt * PT_TO_MM * mult;
}

// All 3 templates now use the same professional serif for the name in the
// browser preview (Source Serif 4) - "times" is jsPDF's closest built-in
// serif match, so every template gets the same treatment here instead of
// the old per-template split (courier for sde-focused, helvetica for
// ai-focused, times for classic only).
function nameFontForTemplate(_templateId: string): { font: string; style: string } {
  return { font: "times", style: "bold" };
}

function ensureSpace(doc: jsPDF, cursor: Cursor, needed: number): void {
  if (cursor.y + needed > A4_HEIGHT_MM - MARGIN_BOTTOM) {
    doc.addPage();
    cursor.y = MARGIN_TOP;
  }
}

interface InlineItem {
  label: string;
  url?: string;
}

// Draws one centered line of items separated by " | ", where each item may
// be a real clickable link (contact links, email) or plain text.
function drawCenteredInlineLine(
  doc: jsPDF,
  cursor: Cursor,
  items: InlineItem[],
  font: string,
  sizePt: number,
  textColor: string,
  sepColor: string
): void {
  if (!items.length) return;
  doc.setFont(font, "normal");
  doc.setFontSize(sizePt);
  const sepText = "   |   ";
  const widths = items.map((item) => doc.getTextWidth(item.label));
  const sepWidth = doc.getTextWidth(sepText);
  const totalWidth = widths.reduce((a, b) => a + b, 0) + sepWidth * (items.length - 1);
  let cx = A4_WIDTH_MM / 2 - totalWidth / 2;
  const y = cursor.y + lh(sizePt, 1.0);

  items.forEach((item, index) => {
    doc.setFont(font, "normal");
    doc.setTextColor(textColor);
    if (item.url) {
      doc.textWithLink(item.label, cx, y, { url: item.url });
    } else {
      doc.text(item.label, cx, y);
    }
    cx += widths[index];
    if (index < items.length - 1) {
      doc.setTextColor(sepColor);
      doc.text(sepText, cx, y);
      cx += sepWidth;
    }
  });

  cursor.y = y + lh(sizePt, 1.0) * 0.2;
}

function drawHeader(doc: jsPDF, cursor: Cursor, resume: Resume, templateId: string, colors: ReturnType<typeof getTemplateColorTokens>): void {
  const nameFont = nameFontForTemplate(templateId);
  doc.setFont(nameFont.font, nameFont.style);
  doc.setFontSize(FS_NAME);
  doc.setTextColor(colors.ink);
  const nameY = cursor.y + lh(FS_NAME, 1.05);
  doc.text(resume.name || "", A4_WIDTH_MM / 2, nameY, { align: "center" });
  cursor.y = nameY + lh(FS_NAME, 1.05) * 0.18;

  const links: ResumeLink[] = resume.contact?.links || [];
  if (links.length) {
    drawCenteredInlineLine(
      doc,
      cursor,
      links.map((link) => ({ label: link.label, url: link.url })),
      "courier",
      FS_CONTACT,
      colors.muted,
      colors.faint
    );
  }

  const detailItems: InlineItem[] = [];
  if (resume.contact?.email) detailItems.push({ label: resume.contact.email, url: `mailto:${resume.contact.email}` });
  if (resume.contact?.phone) detailItems.push({ label: resume.contact.phone });
  if (resume.contact?.location) detailItems.push({ label: resume.contact.location });
  if (detailItems.length) {
    drawCenteredInlineLine(doc, cursor, detailItems, "courier", FS_CONTACT, colors.muted, colors.faint);
  }

  cursor.y += 2;
}

function sectionTitle(doc: jsPDF, cursor: Cursor, label: string, colors: ReturnType<typeof getTemplateColorTokens>): void {
  ensureSpace(doc, cursor, lh(FS_SECTION, 1.2) + 8);
  cursor.y += 3;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(FS_SECTION);
  doc.setTextColor(colors.accent);
  const charSpace = FS_SECTION * 0.16 * PT_TO_MM;
  const y = cursor.y + lh(FS_SECTION, 0.9);
  doc.text(label.toUpperCase(), MARGIN_X, y, { charSpace });
  cursor.y = y + 0.3;
  doc.setDrawColor(colors.rule);
  doc.setLineWidth(0.35);
  doc.line(MARGIN_X, cursor.y, A4_WIDTH_MM - MARGIN_X, cursor.y);
  cursor.y += 1.0;
}

// Builds "Label: skill1, skill2, ..." (or just the skills with no label)
// stopping BEFORE any skill that would overflow the available width -
// discarding the rest rather than wrapping to a second line, per the
// single-line skill row design. Real text measurement via jsPDF makes this
// exact, unlike the old DOM-offsetTop approximation.
function drawTokenRow(
  doc: jsPDF,
  cursor: Cursor,
  label: string | null,
  items: SkillItem[],
  colors: ReturnType<typeof getTemplateColorTokens>
): void {
  const list = items.slice(0, MAX_ROW_SKILLS);
  if (!list.length && !label) return;

  doc.setFontSize(FS_SKILL);
  let x = MARGIN_X;
  const y = cursor.y + lh(FS_SKILL, 1.1);
  const maxWidth = A4_WIDTH_MM - MARGIN_X - x;
  const startX = x;

  if (label) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(colors.ink);
    const labelText = `${label}:`;
    doc.text(labelText, x, y);
    x += doc.getTextWidth(labelText) + doc.getTextWidth(" ");
  }

  // First pass: decide how many items fit.
  let used = x - startX;
  const shown: SkillItem[] = [];
  for (const item of list) {
    doc.setFont("courier", item.bold ? "bold" : "normal");
    const prefix = shown.length ? ", " : "";
    const w = doc.getTextWidth(prefix + item.name);
    if (used + w > maxWidth) break;
    used += w;
    shown.push(item);
  }

  // Second pass: draw.
  let cx = x;
  shown.forEach((item, index) => {
    if (index > 0) {
      doc.setFont("courier", "normal");
      doc.setTextColor(colors.faint);
      doc.text(", ", cx, y);
      cx += doc.getTextWidth(", ");
    }
    doc.setFont("courier", item.bold ? "bold" : "normal");
    doc.setTextColor(item.bold ? colors.accent : colors.muted);
    doc.text(item.name, cx, y);
    cx += doc.getTextWidth(item.name);
  });

  cursor.y = y + lh(FS_SKILL, 1.1) * 0.35;
}

function measureBulletsHeight(doc: jsPDF, points: string[]): number {
  const width = CONTENT_W - BULLET_INDENT;
  let total = 0;
  for (const point of points) {
    const lines = measureWrappedLineCount(doc, point, width, "helvetica", FS_BODY);
    total += lines * lh(FS_BODY, 1.32) + 0.6;
  }
  return total;
}

function drawBullets(doc: jsPDF, cursor: Cursor, points: string[], colors: ReturnType<typeof getTemplateColorTokens>): void {
  const width = CONTENT_W - BULLET_INDENT;
  const bodyColors = { normal: "#25282f", bold: colors.accent };

  for (const point of points) {
    doc.setFontSize(FS_BODY);
    const firstLineY = cursor.y + lh(FS_BODY, 1.32) * 0.72;
    doc.setFillColor(colors.accent);
    doc.circle(MARGIN_X + 1, firstLineY - 1, BULLET_DOT_R, "F");

    const h = drawWrappedRichText(
      doc,
      point,
      MARGIN_X + BULLET_INDENT,
      cursor.y + lh(FS_BODY, 1.32) * 0.8,
      width,
      "helvetica",
      bodyColors,
      lh(FS_BODY, 1.32)
    );
    cursor.y += h + 0.6;
  }
}

interface EntryTop {
  heading: string;
  meta?: string;
  role?: string;
  location?: string;
}

function drawEntryTop(doc: jsPDF, cursor: Cursor, top: EntryTop, colors: ReturnType<typeof getTemplateColorTokens>): void {
  doc.setFont("times", "bold");
  doc.setFontSize(FS_ENTRY);
  doc.setTextColor(colors.ink);
  const y1 = cursor.y + lh(FS_ENTRY, 1.16);
  doc.text(top.heading, MARGIN_X, y1);
  if (top.meta) {
    doc.setFont("courier", "normal");
    doc.setFontSize(FS_META);
    doc.setTextColor(colors.muted);
    doc.text(top.meta, A4_WIDTH_MM - MARGIN_X, y1, { align: "right" });
  }
  cursor.y = y1 + lh(FS_ENTRY, 1.16) * 0.25;

  if (top.role) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(FS_ROLE);
    doc.setTextColor(colors.accent);
    const y2 = cursor.y + lh(FS_ROLE, 1.2);
    doc.text(top.role, MARGIN_X, y2);
    if (top.location) {
      doc.setFont("courier", "normal");
      doc.setFontSize(FS_META);
      doc.setTextColor(colors.muted);
      doc.text(top.location, A4_WIDTH_MM - MARGIN_X, y2, { align: "right" });
    }
    cursor.y = y2 + lh(FS_ROLE, 1.2) * 0.35;
  }
}

// Builds the jsPDF document (no side effects / no browser download trigger)
// - split out from downloadResumePdf so the layout logic itself can be
// exercised directly (e.g. in a script/test that writes the bytes to a
// file) without needing a browser to trigger a save.
export function buildResumePdfDocument(resume: Resume, template: ResumeTemplate): jsPDF {
  const colors = getTemplateColorTokens(template);
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const cursor: Cursor = { y: MARGIN_TOP };

  drawHeader(doc, cursor, resume, template.id, colors);

  if (resume.summary?.trim()) {
    sectionTitle(doc, cursor, "Summary", colors);
    doc.setFontSize(FS_BODY);
    const lineCount = measureWrappedLineCount(doc, resume.summary, CONTENT_W, "helvetica", FS_BODY);
    ensureSpace(doc, cursor, lineCount * lh(FS_BODY, 1.33));
    const h = drawWrappedRichText(
      doc,
      resume.summary,
      MARGIN_X,
      cursor.y + lh(FS_BODY, 1.33) * 0.8,
      CONTENT_W,
      "helvetica",
      { normal: "#25282f", bold: colors.accent },
      lh(FS_BODY, 1.33)
    );
    cursor.y += h;
  }

  const skillEntries = Object.entries(resume.skills || {}).filter(([, items]) => items && items.length > 0);
  if (skillEntries.length) {
    sectionTitle(doc, cursor, "Skills", colors);
    skillEntries.forEach(([category, items]) => {
      ensureSpace(doc, cursor, lh(FS_SKILL, 1.1) + 1);
      drawTokenRow(doc, cursor, category, items, colors);
    });
  }

  if (resume.experience?.length) {
    sectionTitle(doc, cursor, "Experience", colors);
    resume.experience.forEach((exp) => {
      const bulletsHeight = measureBulletsHeight(doc, exp.points || []);
      const techLineHeight = exp.skillsUsed?.length ? lh(FS_META, 1.32) + 1 : 0;
      const topHeight = lh(FS_ENTRY, 1.16) + (exp.role ? lh(FS_ROLE, 1.2) : 0);
      ensureSpace(doc, cursor, topHeight + bulletsHeight + techLineHeight + 4);

      drawEntryTop(
        doc,
        cursor,
        { heading: exp.companyName, meta: exp.duration, role: exp.role, location: exp.location },
        colors
      );
      drawBullets(doc, cursor, exp.points || [], colors);
      if (exp.skillsUsed?.length) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(FS_META);
        doc.setTextColor(colors.muted);
        const labelText = "Tech Stack:  ";
        doc.text(labelText, MARGIN_X, cursor.y + lh(FS_META, 1.1));
        const labelWidth = doc.getTextWidth(labelText);
        drawTokenRowInline(doc, cursor, exp.skillsUsed, colors, labelWidth);
      }
      cursor.y += 4;
    });
  }

  if (resume.projects?.length) {
    sectionTitle(doc, cursor, "Projects", colors);
    resume.projects.forEach((proj) => {
      const [main, secondary] = (proj.name || "").split("—");
      const heading = secondary ? `${main.trim()}   ${secondary.trim()}` : (main || "").trim();
      const aboutLines = measureWrappedLineCount(doc, proj.about || "", CONTENT_W, "helvetica", FS_BODY);
      const aboutHeight = aboutLines * lh(FS_BODY, 1.33);
      const techLineHeight = proj.techStack?.length ? lh(FS_META, 1.32) + 1 : 0;
      const linksText = (proj.links || []).map((l) => l.label).join("   |   ");
      ensureSpace(doc, cursor, lh(FS_ENTRY, 1.16) + aboutHeight + techLineHeight + 4);

      doc.setFont("times", "bold");
      doc.setFontSize(FS_ENTRY);
      doc.setTextColor(colors.ink);
      const y1 = cursor.y + lh(FS_ENTRY, 1.16);
      doc.text(heading, MARGIN_X, y1);
      if (proj.links?.length) {
        doc.setFont("courier", "normal");
        doc.setFontSize(FS_META);
        doc.setTextColor(colors.accent);
        if (proj.links.length === 1) {
          doc.textWithLink(proj.links[0].label, A4_WIDTH_MM - MARGIN_X, y1, { url: proj.links[0].url, align: "right" });
        } else {
          doc.text(linksText, A4_WIDTH_MM - MARGIN_X, y1, { align: "right" });
        }
      }
      cursor.y = y1 + lh(FS_ENTRY, 1.16) * 0.3;

      const h = drawWrappedRichText(
        doc,
        proj.about || "",
        MARGIN_X,
        cursor.y + lh(FS_BODY, 1.33) * 0.8,
        CONTENT_W,
        "helvetica",
        { normal: "#25282f", bold: colors.accent },
        lh(FS_BODY, 1.33)
      );
      cursor.y += h;

      if (proj.techStack?.length) {
        drawTokenRow(doc, cursor, null, proj.techStack, colors);
      }
      cursor.y += 4;
    });
  }

  if (resume.education?.length) {
    sectionTitle(doc, cursor, "Education", colors);
    resume.education.forEach((edu) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(FS_META);
      const label = "Relevant Coursework  ";
      const labelW = doc.getTextWidth(label);
      const courseworkText = (edu.coursework || []).join(", ");
      doc.setFont("helvetica", "normal");
      const courseworkLines: string[] = edu.coursework?.length
        ? (doc.splitTextToSize(courseworkText, CONTENT_W - labelW) as string[])
        : [];

      ensureSpace(
        doc,
        cursor,
        lh(FS_ENTRY, 1.16) + lh(FS_BODY, 1.32) + courseworkLines.length * lh(FS_META, 1.32) + 4
      );

      const y1 = cursor.y + lh(FS_ENTRY, 1.16);
      doc.setFont("times", "bold");
      doc.setFontSize(FS_ENTRY);
      doc.setTextColor(colors.ink);
      doc.text(edu.institution || "", MARGIN_X, y1);
      if (edu.duration) {
        doc.setFont("courier", "normal");
        doc.setFontSize(FS_META);
        doc.setTextColor(colors.muted);
        doc.text(edu.duration, A4_WIDTH_MM - MARGIN_X, y1, { align: "right" });
      }
      cursor.y = y1 + lh(FS_ENTRY, 1.16) * 0.3;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(FS_BODY);
      doc.setTextColor("#25282f");
      const degreeLine = edu.score ? `${edu.degree}   ·   ${edu.score}` : edu.degree || "";
      const y2 = cursor.y + lh(FS_BODY, 1.32) * 0.8;
      doc.text(degreeLine, MARGIN_X, y2);
      cursor.y = y2 + lh(FS_BODY, 1.32) * 0.4;

      if (courseworkLines.length) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(FS_META);
        doc.setTextColor(colors.muted);
        const yFirst = cursor.y + lh(FS_META, 1.32) * 0.8;
        doc.text(label, MARGIN_X, yFirst);
        doc.setFont("helvetica", "normal");
        courseworkLines.forEach((line, index) => {
          doc.text(line, MARGIN_X + (index === 0 ? labelW : 0), yFirst + index * lh(FS_META, 1.32));
        });
        cursor.y += courseworkLines.length * lh(FS_META, 1.32);
      }
      cursor.y += 3.5;
    });
  }

  return doc;
}

export async function downloadResumePdf(resume: Resume, template: ResumeTemplate, filename: string): Promise<void> {
  const doc = buildResumePdfDocument(resume, template);
  doc.save(filename);
}

// Same single-line/discard-overflow token row as drawTokenRow, but starting
// at an already-drawn label's end x (used for "Tech Stack: <tokens>" where
// the label was drawn separately to keep its own font/weight).
function drawTokenRowInline(
  doc: jsPDF,
  cursor: Cursor,
  items: SkillItem[],
  colors: ReturnType<typeof getTemplateColorTokens>,
  startOffsetX: number
): void {
  const list = items.slice(0, MAX_ROW_SKILLS);
  if (!list.length) return;

  doc.setFontSize(FS_META);
  const y = cursor.y + lh(FS_META, 1.1);
  const x = MARGIN_X + startOffsetX;
  const maxWidth = A4_WIDTH_MM - MARGIN_X;

  let used = x - MARGIN_X;
  const shown: SkillItem[] = [];
  for (const item of list) {
    doc.setFont("courier", item.bold ? "bold" : "normal");
    const prefix = shown.length ? ", " : "";
    const w = doc.getTextWidth(prefix + item.name);
    if (used + w > maxWidth - MARGIN_X) break;
    used += w;
    shown.push(item);
  }

  let cx = x;
  shown.forEach((item, index) => {
    if (index > 0) {
      doc.setFont("courier", "normal");
      doc.setTextColor(colors.faint);
      doc.text(", ", cx, y);
      cx += doc.getTextWidth(", ");
    }
    doc.setFont("courier", item.bold ? "bold" : "normal");
    doc.setTextColor(item.bold ? colors.accent : colors.faint);
    doc.text(item.name, cx, y);
    cx += doc.getTextWidth(item.name);
  });

  cursor.y = y + lh(FS_META, 1.1) * 0.35;
}
