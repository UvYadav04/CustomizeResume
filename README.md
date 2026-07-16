# Resume Tailor — Web App

A standalone (no extension, no Chrome) web dashboard version of the Resume Tailor
sidebar extension's architecture: paste a job description, generate tailored
resume suggestions with provider fallback, review changes with accept/reject
controls, and download a finished PDF directly.

Built with React + TypeScript + Vite + Tailwind + shadcn-style components (Radix
primitives) + Zustand. Everything runs client-side in the browser — no backend,
no database. Settings and your resume are persisted to `localStorage`.

**This code was written without a working local shell to run `npm install` /
`npm run build` for verification, so treat first run as a shakeout — see
"Known risk areas" below for what to check first.**

## Setup

```bash
cd webapp
npm install
npm run dev
```

Open the printed local URL (default `http://localhost:5173`).

## Layout

- **Left panel (~20% width):** job details form — role type, title, company,
  location, job description text, and a **Customize** button.
- **Middle panel:** accept/reject review — every suggested change (summary,
  each skill category, each experience bullet + tech stack, each project
  description + tech stack) with its own accept/reject buttons, plus
  per-section and global "accept all / reject all".
- **Right panel:** live resume preview (updates immediately as you
  accept/reject) and a **Download PDF** button that generates and saves the
  file directly — no print dialog.
- **Settings icon (top right):** opens a dialog with four tabs:
  - **Providers** — Groq, Gemini, Ollama: enable/disable, API key, model,
    fallback order (Ollama defaults last since it needs a local server).
  - **Summary** — name, contact info, links, master summary, skill whitelist.
  - **Skills** — every skill category as an editable comma-separated list
    (wrap a skill in `**like this**` to default it to bold). Each box commits
    when you click out of it (not on every keystroke — see "Editing
    textareas" below).
  - **Templates** — pick the default template (or "Auto", which swaps between
    an AI-Engineer-styled template and an SDE-styled template based on the
    selected role), and edit both the **HTML content** and **CSS style** of
    each built-in template. Edits are local to the dialog until you click
    **Save changes** — nothing is written to `localStorage` or shown in the
    live preview/PDF until then.

## How role → template/content mapping works

- `src/lib/constants.ts` → `ROLE_CATEGORY_ORDER` fixes each role to exactly
  5 skill-category titles (agreed in chat) - only those 5 categories are ever
  sent to the model for that role, and it only reorders/rebolds skills
  *within* them, never introduces a category or invents a skill.
- `src/lib/prompt.ts` → `audienceInstruction()` adds an extra system-prompt
  instruction to lean into AI vocabulary vs. core software-engineering
  vocabulary, based on the role's `audience` (`ai` | `sde` | `general`). The
  same prompt also requires suggested text to stay within ±15% of its
  current length, sends the selected role's label explicitly as
  `targetRoleCategory` and instructs the model to actually frame the summary
  around that role (not just lightly edit the master resume's existing
  framing), and asks for every skill reordered by relevance rather than a
  fixed count (see "Dynamic skill-per-line fitting" below for why).
- `src/lib/templates/index.ts` → `resolveTemplate()` swaps the *visual*
  template (colors/fonts) to match the role's audience when the Settings
  template is left on "Auto".

## Dynamic skill-per-line fitting

Skill rows don't show a fixed count (5, 7, whatever) - each category's
label column is a fixed width (`.rt-skill-label { flex: 0 0 48mm; }` in
`templates/render.ts`, shared by all templates) so every row's skills start
at the same vertical line regardless of label length, and the *number* of
skills shown per row is decided by actual rendered layout, not a guess.

The pipeline sends up to 10 reordered (most-to-least relevant) candidates
per category all the way through to rendering. `src/lib/skillLineFit.ts`'s
`trimSkillRowsToOneLine()` then runs against the real DOM - once in the
preview iframe's `onLoad` handler, once in `pdf.ts` before the PDF
screenshot - and removes any skill token whose `offsetTop` differs from the
first token's (i.e., it wrapped to a second line). Since candidates are
already ordered by relevance, trimming from the end is always safe. Net
effect: a category with short skill names might show 8-9 items on one line,
one with long names might show 4, and neither ever overflows or wraps.

## Editable resume templates (HTML + CSS)

Templates are no longer a hardcoded JS render function. Each one is now a
small, safe **mustache-lite** markup string (`src/lib/templates/engine.ts` +
`defaultContent.ts`) — `{{field}}` for text, `{{{field}}}` for text that may
contain `**bold**`, `{{#each list}}...{{/each}}` to repeat, `{{#if flag}}...{{/if}}`
to conditionally render. No `eval`, no arbitrary JS execution — a typo in a
hand-edited template just renders as empty rather than crashing anything.

Settings > Templates lets you edit this HTML alongside the CSS, per
template, with an explicit **Save changes** button. `renderTemplateWithOverride()`
in `src/lib/templates/index.ts` is the single place both the preview panel
and the PDF export resolve "built-in default, unless there's a saved
override" from — so they can never show different content from each other.

## Editing textareas (bugfix note)

A few Settings fields (Skills categories, Links, skill whitelist) work by
parsing free text into structured data and formatting it back as text. Doing
that on every keystroke was eating characters as you typed — e.g. typing a
comma or trailing space got silently stripped before you could type the next
skill, because the parser treated it as an incomplete/empty token. Fixed via
`src/components/settings/SyncedTextarea.tsx`, which keeps local draft state
while a field is focused and only parses+saves on blur (still to
`localStorage`, just not on every keystroke).

## Providers

Groq and Gemini are orchestrated by a small **LangGraph** state graph
(`src/lib/langgraph/tailorGraph.ts`) that runs entirely in the browser — no
backend/server in between. Each enabled provider (in the order set in
Settings) is a node in the graph; a conditional edge moves to the next node
only if the previous one failed, otherwise it goes straight to the end. This
replaces the old plain-`fetch`-with-a-for-loop fallback with an actual graph,
while keeping the exact same fallback behavior.

- **Groq** — called via `@langchain/groq`'s `ChatGroq` client
  (`src/lib/langgraph/chatModels.ts`). Its underlying SDK blocks browser
  usage by default (it's meant to stop you from shipping API keys to
  untrusted users), so it's explicitly opted in via
  `clientOptions: { dangerouslyAllowBrowser: true }` — appropriate here since
  this is a single-user app and the key never leaves your own browser.
- **Gemini** — called via `@langchain/google-genai`'s
  `ChatGoogleGenerativeAI` client, which is designed to run in the browser.
- **Ollama** — stays outside the graph's LangChain wrapper, called with a
  plain `fetch` to your local Ollama server
  (`src/lib/providers/ollama.ts`), same as before. Needs `OLLAMA_ORIGINS`
  set (e.g. `OLLAMA_ORIGINS=http://localhost:5173`) so the browser is allowed
  to call it.

The old plain-`fetch` implementations for Groq/Gemini are still in
`src/lib/providers/groq.ts` and `gemini.ts`, kept only as reference — they're
no longer called by the router.

## Known risk areas (unverified — no shell was available to `npm install`/build)

1. **`package.json` version pins** — pinned to versions current as of this
   writing; `npm install` may pull a patch/minor bump that shifts an API
   slightly (most likely candidates: `html2pdf.js`, the Radix packages, or
   Tailwind v3 vs. a v4 you might already have elsewhere).
2. **`tailwind.config.ts`** — Tailwind v3's TS config support depends on
   `jiti` resolving correctly in your Node version. If `npm run dev` errors
   on the config file, rename it to `tailwind.config.js` and drop the
   `import type { Config }` line.
3. **`html2pdf.js` PDF export** (`src/lib/pdf.ts`) — untested end-to-end.
   If the downloaded PDF is blank or mis-paginated, the likely fix is
   tuning `html2canvas.scale` or `pagebreak.mode` in that file, or swapping
   to a `jsPDF` + `html2canvas` call built by hand for tighter control.
4. **CORS on Gemini/Groq from a browser** — both are expected to allow
   direct browser calls with an API key, matching what the original
   extension did, but confirm you don't hit a CORS error in devtools; if so,
   the fix is a tiny local proxy (not included here since the extension
   didn't need one).
5. **LangGraph in the browser** — uses the `@langchain/langgraph/web`
   subpath specifically to avoid Node-only dependencies (checkpointing,
   sqlite, etc.). If `npm install`/`vite` still pulls in a Node-specific
   transitive dependency that fails to bundle, the fallback is to inline the
   same sequential try/catch logic without LangGraph (the previous
   `router.ts` implementation is easy to restore from git history/this
   conversation).
6. **Groq's `dangerouslyAllowBrowser` option** — `@langchain/groq`'s exact
   constructor shape for passing this through to the underlying `groq-sdk`
   client wasn't verified against the installed version. If it errors or is
   silently ignored (Groq calls fail with a "browser-like environment"
   error), check `@langchain/groq`'s current docs for where that flag
   belongs — it may be a top-level constructor field rather than nested
   under `clientOptions`.
7. **Mini-template engine** (`src/lib/templates/engine.ts`) — hand-rolled,
   not a real templating library, and not run through a test yet. It's
   deliberately fault-tolerant (unresolved/malformed tags render as empty
   rather than throwing), so the most likely failure mode is *silently
   blank* output rather than a crash — if a custom template renders empty
   after editing it, check for a typo in a `{{#each}}`/`{{#if}}` tag name
   before assuming something deeper is broken. `getTemplates()`'s built-in
   `DEFAULT_RESUME_HTML` is the known-good reference to diff against.
8. **First run** seeds your resume from `src/data/resume-seed.ts` — edit that
   file's data or use Settings → Summary/Skills once it's loaded.

## Project layout

```
src/
  lib/            core logic ported from the extension (constants, storage,
                   resume-utils, prompt building, AI provider calls, router)
  lib/templates/   3 visual resume templates (Classic / AI Engineer / SDE)
  lib/pdf.ts       direct-download PDF export (html2pdf.js)
  store/           Zustand store (resume, settings, job description,
                   suggestions, accept/reject selections)
  components/ui/   shadcn-style primitives (button, dialog, tabs, etc.)
  components/form/     left panel
  components/review/   middle panel
  components/preview/  right panel
  components/settings/ settings dialog + its 4 tabs
  data/resume-seed.ts  default resume content
```
