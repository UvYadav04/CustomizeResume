import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useAppStore } from "@/store/useAppStore";
import { applyAcceptedChanges } from "@/lib/resume-utils";
import { resolveTemplate, renderTemplateWithOverride, GOOGLE_FONTS_URL } from "@/lib/templates";
import { roleAudience, RESUME_FILE_BASENAME } from "@/lib/constants";
import { downloadResumePdf } from "@/lib/pdf";
import { trimSkillRowsToOneLine } from "@/lib/skillLineFit";
import { PRINT_PREVIEW_KEYS } from "@/components/preview/PrintPreviewPage";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileDown, Loader2, Printer } from "lucide-react";

export function ResumePreview() {
  const resume = useAppStore((s) => s.resume);
  const roleScopedResume = useAppStore((s) => s.roleScopedResume);
  const suggestions = useAppStore((s) => s.suggestions);
  const selections = useAppStore((s) => s.selections);
  const settings = useAppStore((s) => s.settings);
  const templateOverrides = useAppStore((s) => s.templateOverrides);
  const jobDescription = useAppStore((s) => s.jobDescription);
  const [isDownloading, setIsDownloading] = useState(false);

  // Before the first "Customize", there's nothing scoped yet, so the full
  // master resume shows as-is. After a generation, the preview/PDF is based
  // on that generation's role-scoped copy (only its 5 skill categories) with
  // accepted suggestions applied - the master resume itself is never
  // touched by this, so Settings always shows the full skill set.
  const previewResume = useMemo(() => {
    const base = roleScopedResume || resume;
    if (!suggestions || !selections) {
      return base;
    }
    return applyAcceptedChanges(base, suggestions, selections);
  }, [resume, roleScopedResume, suggestions, selections]);

  const template = useMemo(
    () => resolveTemplate(settings.templateId, roleAudience(jobDescription.roleType)),
    [settings.templateId, jobDescription.roleType]
  );

  // Only ever reflects a *saved* override (Settings > Templates > Save) -
  // unsaved edits in that dialog stay local to it until the person clicks
  // Save, so this panel and the PDF export never show half-typed markup.
  const { html, css } = useMemo(
    () => renderTemplateWithOverride(template, previewResume, templateOverrides[template.id]),
    [template, previewResume, templateOverrides]
  );

  const srcDoc = useMemo(() => {
    return `<!doctype html><html><head><meta charset="utf-8" />
      <link rel="stylesheet" href="${GOOGLE_FONTS_URL}" />
      <style>${css}</style>
      </head><body>${html}</body></html>`;
  }, [css, html]);

  // Re-runs every time srcDoc changes (React resets the iframe's document,
  // firing onLoad again). Waits for webfonts to actually apply before
  // measuring, since fallback-font metrics would give a wrong first line.
  async function handleIframeLoad(event: React.SyntheticEvent<HTMLIFrameElement>) {
    const doc = event.currentTarget.contentDocument;
    if (!doc) return;
    try {
      await doc.fonts?.ready;
    } catch {
      // ignore - fall through and trim with whatever's rendered
    }
    // Same extra settle beat as the PDF export path (pdf.ts): fonts.ready
    // can resolve just before the swapped-in web font actually repaints,
    // so measuring immediately can trim against stale (narrower/fallback)
    // widths - a row that fit under the fallback font can still overflow
    // once the real font paints in, which is what let long tokens like
    // "Hugging Face Transformers" slip through untrimmed.
    await new Promise((resolve) => setTimeout(resolve, 150));
    trimSkillRowsToOneLine(doc);
  }

  async function handleDownload() {
    setIsDownloading(true);
    try {
      const company = jobDescription.company.trim().replace(/\s+/g, "_");
      const filename = company ? `${RESUME_FILE_BASENAME}_${company}.pdf` : `${RESUME_FILE_BASENAME}.pdf`;
      await downloadResumePdf(previewResume, template, filename);
      toast.success("Resume downloaded.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not generate PDF.");
    } finally {
      setIsDownloading(false);
    }
  }

  // Opens the exact same HTML/CSS this panel renders in a real browser tab
  // and lets the browser's own print pipeline turn it into a PDF (via the
  // "Save as PDF" destination in the print dialog). Unlike the "Download
  // PDF" button above (which draws real text with jsPDF, close to but not
  // pixel-identical to this panel), this route IS the browser rendering
  // this exact markup - so what prints matches this preview exactly.
  //
  // This opens a real, same-origin page (this same app, at
  // "?printPreview=1" - see PrintPreviewPage.tsx / App.tsx), NOT a blob:
  // URL. An earlier version used a blob: URL, which turned out to make
  // some browsers/print pipelines rasterize the whole page into an image
  // instead of keeping real text - exactly what the original Chrome
  // extension's print page (a real chrome-extension:// page, not a blob)
  // never had a problem with. Passing the data via sessionStorage instead
  // of baking it into the URL works because window.open() on the same
  // origin clones the opener's sessionStorage into the new tab.
  function handleOpenPrintView() {
    const company = jobDescription.company.trim().replace(/\s+/g, "_");
    const filenameBase = company ? `${RESUME_FILE_BASENAME}_${company}` : RESUME_FILE_BASENAME;

    sessionStorage.setItem(PRINT_PREVIEW_KEYS.html, html);
    sessionStorage.setItem(PRINT_PREVIEW_KEYS.css, css);
    sessionStorage.setItem(PRINT_PREVIEW_KEYS.title, filenameBase);
    sessionStorage.setItem(PRINT_PREVIEW_KEYS.fontsUrl, GOOGLE_FONTS_URL);

    const printUrl = `${window.location.origin}${window.location.pathname}?printPreview=1`;
    const win = window.open(printUrl, "_blank");
    if (!win) {
      toast.error("Pop-up blocked — allow pop-ups for this site to open the print view.");
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold">Preview</h2>
          <div className="mt-0.5 flex items-center gap-1.5">
            <Badge variant="secondary">{template.label}</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleOpenPrintView} title="Opens this exact preview in a new tab to print/save as PDF">
            <Printer className="h-3.5 w-3.5" />
            Print / Save as PDF
          </Button>
          <Button size="sm" onClick={handleDownload} disabled={isDownloading}>
            {isDownloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            Download PDF
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-auto bg-muted/40">
        <iframe title="resume-preview" srcDoc={srcDoc} className="h-full w-full border-0" onLoad={handleIframeLoad} />
      </div>
      <div className="flex items-center gap-1.5 border-t px-4 py-2 text-[11px] text-muted-foreground">
        <FileDown className="h-3 w-3" />
        "Download PDF" saves directly, no dialog. "Print / Save as PDF" opens this exact preview in a new tab if you want a pixel-identical printout.
      </div>
    </div>
  );
}
