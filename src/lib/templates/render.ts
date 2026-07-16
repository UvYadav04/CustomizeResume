// NOTE: renderResumeHtml() below (the JS-function-based renderer) is no
// longer used for actual rendering - templates now render through the
// mini-template engine (engine.ts) against DEFAULT_RESUME_HTML
// (defaultContent.ts) so the markup is editable in Settings > Templates.
// Only BASE_TEMPLATE_STYLES is still imported from this file. Kept as
// reference/fallback since it's a known-correct implementation of the same
// output.
import { escapeHtml, formatTextWithBoldMarkers } from "../utils";
import type { Resume, SkillItem } from "../types";

const MAX_VISIBLE_SKILLS = 5;

function limitVisibleSkills(items: SkillItem[] = []) {
  return items.slice(0, MAX_VISIBLE_SKILLS);
}

function renderTokenList(items: SkillItem[] = []) {
  return limitVisibleSkills(items)
    .map((item) => `<span class="rt-token${item.bold ? " is-bold" : ""}">${escapeHtml(item.name)}</span>`)
    .join("");
}

function renderLinks(links: { label: string; url: string }[] = []) {
  return links
    .map((link) => `<a href="${escapeHtml(link.url)}" target="_blank" rel="noreferrer">${escapeHtml(link.label)}</a>`)
    .join('<span class="rt-contact-sep">|</span>');
}

function renderContact(resume: Resume) {
  const contact = resume.contact || {};
  const items: string[] = [];

  if (contact.email) {
    items.push(`<a href="mailto:${escapeHtml(contact.email)}">${escapeHtml(contact.email)}</a>`);
  }
  if (contact.phone) {
    items.push(`<span>${escapeHtml(contact.phone)}</span>`);
  }
  if (contact.location) {
    items.push(`<span>${escapeHtml(contact.location)}</span>`);
  }
  if (contact.links?.length) {
    items.push(renderLinks(contact.links));
  }
  return items.join('<span class="rt-contact-sep">|</span>');
}

// Shared markup across every visual template - only `styles` differs between
// templates (colors/fonts/density), so editing a template in Settings just
// means editing this same structural HTML's CSS.
export function renderResumeHtml(resume: Resume): string {
  return `
    <main class="rt-page">
      <header class="rt-header">
        <h1 class="rt-name">${escapeHtml(resume.name || "")}</h1>
        <p class="rt-contact">${renderContact(resume)}</p>
        <div class="rt-header-rule"></div>
      </header>

      <section class="rt-section">
        <h2 class="rt-section-title">Summary</h2>
        <p class="rt-summary">${formatTextWithBoldMarkers(resume.summary || "")}</p>
      </section>

      <section class="rt-section">
        <h2 class="rt-section-title">Skills</h2>
        <div class="rt-skills">
          ${Object.entries(resume.skills || {})
            .map(
              ([label, items]) => `
            <div class="rt-skill-row">
              <span class="rt-skill-label">${escapeHtml(label)}:</span>
              <span class="rt-token-wrap">${renderTokenList(items)}</span>
            </div>
          `
            )
            .join("")}
        </div>
      </section>

      <section class="rt-section">
        <h2 class="rt-section-title">Experience</h2>
        ${(resume.experience || [])
          .map(
            (item) => `
          <article class="rt-entry">
            <div class="rt-entry-top">
              <h3 class="rt-entry-heading">${escapeHtml(item.companyName || "")}</h3>
              <div class="rt-entry-meta">${escapeHtml(item.duration || "")}</div>
            </div>
            <div class="rt-entry-sub">
              <div class="rt-entry-role">${escapeHtml(item.role || "")}</div>
              ${item.location ? `<div class="rt-entry-location">${escapeHtml(item.location)}</div>` : ""}
            </div>
            <ul class="rt-entry-bullets">
              ${(item.points || []).map((point) => `<li>${formatTextWithBoldMarkers(point)}</li>`).join("")}
            </ul>
            ${item.skillsUsed?.length ? `<p class="rt-tech-line"><span class="rt-tech-label">Tech Stack:&nbsp;&nbsp;</span>${renderTokenList(item.skillsUsed)}</p>` : ""}
          </article>
        `
          )
          .join("")}
      </section>

      <section class="rt-section">
        <h2 class="rt-section-title">Projects</h2>
        ${(resume.projects || [])
          .map(
            (item) => `
          <article class="rt-entry">
            <div class="rt-project-top">
              <h3 class="rt-project-name">
                ${escapeHtml(item.name.split("—")[0] || "")}
                ${item.name.includes("—") ? `<span class="rt-project-secondary" style="font-size:0.89em; color:var(--rt-faint); font-weight:normal; margin-left:0.4em;">${escapeHtml(item.name.split("—")[1].trim())}</span>` : ""}
              </h3>
              <div class="rt-project-links">${renderLinks(item.links || [])}</div>
            </div>
            <p class="rt-project-about">${formatTextWithBoldMarkers(item.about || "")}</p>
            ${item.techStack?.length ? `<p class="rt-tech-line">${renderTokenList(item.techStack)}</p>` : ""}
          </article>
        `
          )
          .join("")}
      </section>

      <section class="rt-section">
        <h2 class="rt-section-title">Education</h2>
        ${(resume.education || [])
          .map(
            (item) => `
          <article class="rt-entry">
            <div class="rt-edu-top">
              <h3 class="rt-edu-inst">${escapeHtml(item.institution || "")}</h3>
              <div class="rt-entry-meta">${escapeHtml(item.duration || "")}</div>
            </div>
            <p class="rt-edu-degree">
              ${escapeHtml(item.degree || "")}
              ${item.score ? `&nbsp;·&nbsp;<span class="rt-edu-score">${escapeHtml(item.score)}</span>` : ""}
            </p>
            ${(item.coursework || []).length ? `<p class="rt-coursework"><strong>Relevant Coursework&nbsp;&nbsp;</strong>${escapeHtml((item.coursework || []).join(", "))}</p>` : ""}
          </article>
        `
          )
          .join("")}
      </section>
    </main>
  `;
}

// Structural CSS shared by all templates (layout, spacing, print rules).
// Templates only override the :root color/font tokens on top of this.
export const BASE_TEMPLATE_STYLES = `
* { box-sizing: border-box; }

html, body {
  margin: 0;
  background: #eceef0;
  color: var(--rt-ink);
  font-family: var(--rt-sans);
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

.rt-page {
  width: var(--rt-page-width);
  min-height: var(--rt-page-height);
  margin: 0px auto;
  /* Top padding trimmed down (was 9mm) - with the header rule removed below,
     the old top padding left a noticeably large gap before the name even
     started. */
  padding: 5mm 13mm 8mm;
  background: var(--rt-page);
  box-shadow: 0 6px 30px rgba(0, 0, 0, 0.12);
}

.rt-header { text-align: center; margin-bottom: 4px; }

.rt-name {
  margin: 0;
  font-family: var(--rt-serif);
  font-size: var(--rt-fs-name);
  font-weight: 600;
  letter-spacing: 0.01em;
  line-height: 1.05;
}

.rt-contact {
  margin: 4px 0 0;
  color: var(--rt-muted);
  font-family: var(--rt-mono);
  font-size: 8.8pt;
  line-height: 1.35;
}
.rt-contact + .rt-contact { margin-top: 1px; }
.rt-contact a { color: var(--rt-muted); text-decoration: none; }
.rt-contact a, .rt-contact > span { white-space: nowrap; }
.rt-contact-sep { color: var(--rt-faint); margin: 0 6px; white-space: nowrap; }

.rt-section { margin-top: 9px; }


.rt-section-title {
  margin: 0 0 2px;
  padding-bottom: 0.5px;
  border-bottom: 1.5px solid var(--rt-rule);
  color: var(--rt-accent);
  font-family: var(--rt-sans);
  font-size: var(--rt-fs-section);
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.rt-summary, .rt-entry-bullets li, .rt-project-about, .rt-edu-degree {
  color: #25282f;
  font-family: var(--rt-sans);
  font-size: var(--rt-fs-body);
  line-height: 1.33;
}
.rt-summary, .rt-project-about, .rt-edu-degree, .rt-coursework { margin: 0; }

.rt-skills { display: flex; flex-direction: column; }

.rt-skill-row {
  display: flex;
  align-items: baseline;
  flex-wrap: nowrap;
  gap: 2px 4px;
  padding: 2px 0;
  color: var(--rt-muted);
  font-size: var(--rt-fs-skill);
  line-height: 1.36;
}
.rt-skill-row + .rt-skill-row { border-top: 1px dotted var(--rt-rule-soft); }

.rt-skill-label {
  flex: 0 0 auto;
  color: var(--rt-ink);
  font-family: var(--rt-sans);
  font-weight: 600;
  white-space: nowrap;
}

.rt-token-wrap, .rt-tech-line { font-family: var(--rt-mono); min-width: 0; overflow-wrap: break-word; }
.rt-token-wrap { flex: 1 1 0; }
.rt-token { white-space: normal; }
.rt-token + .rt-token::before { content: ","; margin: 0 4px 0 0; color: var(--rt-faint); }

.rt-entry { margin: 0 0 7px; break-inside: avoid; }
.rt-entry:last-child { margin-bottom: 0; }

.rt-entry-top, .rt-entry-sub, .rt-project-top, .rt-edu-top {
  display: flex; justify-content: space-between; gap: 12px; align-items: baseline;
}

.rt-entry-heading, .rt-project-name, .rt-edu-inst {
  margin: 0;
  color: var(--rt-ink);
  font-family: var(--rt-serif);
  font-size: var(--rt-fs-entry);
  font-weight: 600;
  line-height: 1.16;
}

.rt-entry-meta, .rt-entry-location, .rt-project-links, .rt-coursework {
  color: var(--rt-muted);
  font-family: var(--rt-mono);
  font-size: var(--rt-fs-meta);
  line-height: 1.32;
}
.rt-entry-meta, .rt-entry-location { white-space: nowrap; }

.rt-entry-role { margin: 1px 0 3px; color: var(--rt-accent); font-size: var(--rt-fs-role); font-weight: 600; }

.rt-entry-bullets { margin: 0; padding: 0; list-style: none; }
.rt-entry-bullets li { position: relative; margin-bottom: 1.5px; padding-left: 12px; }
.rt-entry-bullets li::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0.55em;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--rt-accent);
}

.rt-tech-line { margin-top: 2px; color: var(--rt-faint); font-size: var(--rt-fs-meta); line-height: 1.32; }
.rt-tech-label { color: var(--rt-muted); font-weight: 500; }

.rt-project-links { display: flex; gap: 5px; white-space: nowrap; }
.rt-project-links a { color: var(--rt-accent); text-decoration: none; }

.rt-project-about { margin-top: 2px; }
.rt-edu-degree { margin-top: 2px; }
.rt-edu-score { color: var(--rt-accent); font-weight: 600; }
.rt-coursework { margin-top: 2px; }

strong, .is-bold { color: var(--rt-accent); font-weight: 700; }
.rt-token.is-bold { color: var(--rt-accent); font-weight: 600; }

@page { size: A4; margin: 0; }

@media (max-width: 760px) {
  .rt-page { width: auto; height: auto; min-height: var(--rt-page-height); padding: 20px; }
}

/* The 24px/auto margin on .rt-page (set above) is only there to center the
   page on the gray backdrop when previewing on screen. Printing doesn't
   need that backdrop treatment, and that top margin is real rendered
   content - not something @page's margin:0 touches - so left as-is it
   shows up as blank space above the resume in the printed/saved PDF and
   can even push content onto a second page. Zero it out for print. */
@media print {
  html, body { background: #fff !important; }
  .rt-page { margin: 0 !important; box-shadow: none !important; }
}
`;
