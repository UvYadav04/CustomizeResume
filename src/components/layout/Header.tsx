import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Settings, FileText, FileSearch, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SettingsDialog } from "@/components/settings/SettingsDialog";
import { useAppStore } from "@/store/useAppStore";
import { applyAcceptedChanges } from "@/lib/resume-utils";
import { resolveTemplate, renderTemplateWithOverride } from "@/lib/templates";
import { roleAudience, RESUME_FILE_BASENAME } from "@/lib/constants";
import { downloadResumePdf } from "@/lib/pdf";
import { openResumeReviewTab } from "@/lib/openResumeReviewTab";

// "Review resume" opens the real rendered resume directly in a new browser
// tab (full page size, real margins/padding) - there is no separate
// full-width "review" screen inside the app itself. That tab is also where
// printing/saving as PDF via the browser's own print pipeline happens (see
// PrintPreviewPage.tsx).
export function Header() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const resume = useAppStore((s) => s.resume);
  const roleScopedResume = useAppStore((s) => s.roleScopedResume);
  const suggestions = useAppStore((s) => s.suggestions);
  const selections = useAppStore((s) => s.selections);
  const settings = useAppStore((s) => s.settings);
  const templateOverrides = useAppStore((s) => s.templateOverrides);
  const jobDescription = useAppStore((s) => s.jobDescription);

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

  const { html, css } = useMemo(
    () => renderTemplateWithOverride(template, previewResume, templateOverrides[template.id]),
    [template, previewResume, templateOverrides]
  );

  const filenameBase = useMemo(() => {
    const company = jobDescription.company.trim().replace(/\s+/g, "_");
    return company ? `${RESUME_FILE_BASENAME}_${company}` : RESUME_FILE_BASENAME;
  }, [jobDescription.company]);

  function handleReviewResume() {
    const opened = openResumeReviewTab({ html, css, filenameBase });
    if (!opened) {
      toast.error("Pop-up blocked — allow pop-ups for this site to open the resume.");
    }
  }

  async function handleDownload() {
    setIsDownloading(true);
    try {
      await downloadResumePdf(previewResume, template, `${filenameBase}.pdf`);
      toast.success("Resume downloaded.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not generate PDF.");
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b bg-card px-4">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <FileText className="h-4 w-4" />
        </div>
        <div>
          <h1 className="text-sm font-semibold leading-none">Resume Tailor</h1>
          <p className="text-[11px] text-muted-foreground">JD-aware resume customizer</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={handleReviewResume} title="Opens the real, full-size resume in a new tab">
          <FileSearch className="h-3.5 w-3.5" /> Review resume
        </Button>
        <Button size="sm" onClick={handleDownload} disabled={isDownloading}>
          {isDownloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
          Download PDF
        </Button>
        <Button variant="outline" size="icon" onClick={() => setSettingsOpen(true)} title="Settings">
          <Settings className="h-4 w-4" />
        </Button>
      </div>
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </header>
  );
}
