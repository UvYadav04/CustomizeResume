import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { DiffRow } from "./DiffRow";
import { SkillListPreview } from "./SkillListPreview";
import { EditableSkillList } from "./EditableSkillList";
import { CheckCheck, Sparkles, XCircle } from "lucide-react";
import type { LayoutSettings } from "@/lib/types";

export function ReviewPanel() {
  const suggestions = useAppStore((s) => s.suggestions);
  const selections = useAppStore((s) => s.selections);
  const isGenerating = useAppStore((s) => s.isGenerating);
  const error = useAppStore((s) => s.error);
  const generationMeta = useAppStore((s) => s.generationMeta);
  const settings = useAppStore((s) => s.settings);
  const setSettings = useAppStore((s) => s.setSettings);
  const bulkSetSection = useAppStore((s) => s.bulkSetSection);
  const setPointSelection = useAppStore((s) => s.setPointSelection);
  const setSkillSelection = useAppStore((s) => s.setSkillSelection);
  const setExperienceSelection = useAppStore((s) => s.setExperienceSelection);
  const setProjectSelection = useAppStore((s) => s.setProjectSelection);
  const editSummarySuggestion = useAppStore((s) => s.editSummarySuggestion);
  const editSkillGroupSuggestion = useAppStore((s) => s.editSkillGroupSuggestion);
  const editExperienceSkillsUsedSuggestion = useAppStore((s) => s.editExperienceSkillsUsedSuggestion);
  const editProjectTechStackSuggestion = useAppStore((s) => s.editProjectTechStackSuggestion);

  // Applies immediately (no draft/Save step, unlike Settings > Templates'
  // copy of the same control) - this lives on the review page specifically
  // so spacing can be tuned live against the resume you're currently
  // reviewing, without leaving to open the Settings dialog.
  function updateLayout(patch: Partial<LayoutSettings>) {
    setSettings({ ...settings, layout: { ...settings.layout, ...patch } });
  }

  if (isGenerating) {
    return (
      <div className="flex h-full flex-col">
        <SpacingBar layout={settings.layout} onChange={updateLayout} />
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
          <Sparkles className="h-5 w-5 animate-pulse text-primary" />
          Tailoring your resume against the job description…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col">
        <SpacingBar layout={settings.layout} onChange={updateLayout} />
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center text-sm">
          <XCircle className="h-5 w-5 text-destructive" />
          <p className="font-medium text-destructive">Generation failed</p>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!suggestions || !selections) {
    return (
      <div className="flex h-full flex-col">
        <SpacingBar layout={settings.layout} onChange={updateLayout} />
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center text-sm text-muted-foreground">
          <Sparkles className="h-5 w-5" />
          Fill in the job details on the left and click Customize to generate suggestions.
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <SpacingBar layout={settings.layout} onChange={updateLayout} />

      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold">Review changes</h2>
          {generationMeta && (
            <p className="text-[11px] text-muted-foreground">Generated via {generationMeta.providerUsed}</p>
          )}
        </div>
        <div className="flex gap-1.5">
          <Button size="sm" variant="outline" onClick={() => acceptAllSections(bulkSetSection)}>
            <CheckCheck className="h-3.5 w-3.5" /> Accept all
          </Button>
          <Button size="sm" variant="ghost" onClick={() => rejectAllSections(bulkSetSection)}>
            Reject all
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-5 p-4">
          <section className="space-y-2">
            <SectionHeader title="Professional Summary" onAccept={() => bulkSetSection("summary", "accepted")} onReject={() => bulkSetSection("summary", "rejected")} />
            <DiffRow
              current={suggestions.summary.current}
              suggested={suggestions.summary.suggested}
              suggestedText={suggestions.summary.suggested}
              onSuggestedTextChange={editSummarySuggestion}
              reason={suggestions.summary.reason}
              state={selections.summary}
              onAccept={() => setPointSelection("summary", "accepted")}
              onReject={() => setPointSelection("summary", "rejected")}
            />
          </section>

          <Separator />

          <section className="space-y-2">
            <SectionHeader title="Technical Skills" onAccept={() => bulkSetSection("skills", "accepted")} onReject={() => bulkSetSection("skills", "rejected")} />
            <div className="space-y-2">
              {suggestions.skills.map((group) => (
                <DiffRow
                  key={group.category}
                  label={group.category}
                  current={<SkillListPreview items={group.current} />}
                  suggested={<EditableSkillList items={group.suggested} onChange={(items) => editSkillGroupSuggestion(group.category, items)} />}
                  reason={group.reason}
                  state={selections.skills[group.category] || "pending"}
                  onAccept={() => setSkillSelection(group.category, "accepted")}
                  onReject={() => setSkillSelection(group.category, "rejected")}
                />
              ))}
            </div>
          </section>

          <Separator />

          <section className="space-y-3">
            <SectionHeader title="Work Experience" onAccept={() => bulkSetSection("experience", "accepted")} onReject={() => bulkSetSection("experience", "rejected")} />
            {suggestions.experience.map((entry, entryIndex) => {
              const state = selections.experience[entryIndex];
              if (!state) return null;
              return (
                <div key={entry.companyName} className="space-y-2 rounded-md border border-dashed p-2.5">
                  <p className="text-xs font-semibold">{entry.companyName} · {entry.role}</p>
                  <DiffRow
                    label="Tech stack"
                    current={<SkillListPreview items={entry.skillsUsed.current} />}
                    suggested={<EditableSkillList items={entry.skillsUsed.suggested} onChange={(items) => editExperienceSkillsUsedSuggestion(entryIndex, items)} />}
                    reason={entry.skillsUsed.reason}
                    state={state.skillsUsed}
                    onAccept={() => setExperienceSelection(entryIndex, { skillsUsed: "accepted" })}
                    onReject={() => setExperienceSelection(entryIndex, { skillsUsed: "rejected" })}
                  />
                </div>
              );
            })}
          </section>

          <Separator />

          <section className="space-y-3">
            <SectionHeader title="Projects" onAccept={() => bulkSetSection("projects", "accepted")} onReject={() => bulkSetSection("projects", "rejected")} />
            {suggestions.projects.map((project, projectIndex) => {
              const state = selections.projects[projectIndex];
              if (!state) return null;
              return (
                <div key={project.name} className="space-y-2 rounded-md border border-dashed p-2.5">
                  <p className="text-xs font-semibold">
                    {project.name.split("—")[0].trim()}
                    {project.name.includes("—") && (
                      <span className="font-normal text-muted-foreground">
                        {" "}
                        : {project.name.split("—")[1].trim()}
                      </span>
                    )}
                  </p>
                  <DiffRow
                    label="Tech stack"
                    current={<SkillListPreview items={project.techStack.current} />}
                    suggested={<EditableSkillList items={project.techStack.suggested} onChange={(items) => editProjectTechStackSuggestion(projectIndex, items)} />}
                    reason={project.techStack.reason}
                    state={state.techStack}
                    onAccept={() => setProjectSelection(projectIndex, { techStack: "accepted" })}
                    onReject={() => setProjectSelection(projectIndex, { techStack: "rejected" })}
                  />
                </div>
              );
            })}
          </section>
        </div>
      </ScrollArea>
    </div>
  );
}

// Live page-spacing controls (top/left-right/bottom margin, in mm), pinned
// to the very top of the review page. Unlike the identical-looking control
// in Settings > Templates (which only applies once "Save changes" is
// clicked), this one writes straight to the store on every change, so the
// person can nudge spacing while actually looking at the resume they're
// reviewing rather than round-tripping through the Settings dialog.
function SpacingBar({ layout, onChange }: { layout: LayoutSettings; onChange: (patch: Partial<LayoutSettings>) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-b bg-muted/30 px-4 py-2">
      <span className="text-[11px] font-medium text-muted-foreground">Page spacing</span>
      <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        Top
        <Input
          type="number"
          min={0}
          max={20}
          step={0.5}
          value={layout.paddingTop}
          onChange={(e) => onChange({ paddingTop: Number(e.target.value) })}
          className="h-7 w-16 px-2 text-xs"
        />
        mm
      </label>
      <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        Left/Right
        <Input
          type="number"
          min={5}
          max={25}
          step={0.5}
          value={layout.paddingX}
          onChange={(e) => onChange({ paddingX: Number(e.target.value) })}
          className="h-7 w-16 px-2 text-xs"
        />
        mm
      </label>
      <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        Bottom
        <Input
          type="number"
          min={0}
          max={25}
          step={0.5}
          value={layout.paddingBottom}
          onChange={(e) => onChange({ paddingBottom: Number(e.target.value) })}
          className="h-7 w-16 px-2 text-xs"
        />
        mm
      </label>
    </div>
  );
}

function SectionHeader({ title, onAccept, onReject }: { title: string; onAccept: () => void; onReject: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      <div className="flex gap-1">
        <button onClick={onAccept} className="text-[11px] font-medium text-success hover:underline">
          Accept all
        </button>
        <span className="text-[11px] text-muted-foreground">/</span>
        <button onClick={onReject} className="text-[11px] font-medium text-destructive hover:underline">
          Reject all
        </button>
      </div>
    </div>
  );
}

function acceptAllSections(bulkSetSection: (s: "summary" | "skills" | "experience" | "projects", v: "accepted" | "rejected" | "pending") => void) {
  bulkSetSection("summary", "accepted");
  bulkSetSection("skills", "accepted");
  bulkSetSection("experience", "accepted");
  bulkSetSection("projects", "accepted");
}

function rejectAllSections(bulkSetSection: (s: "summary" | "skills" | "experience" | "projects", v: "accepted" | "rejected" | "pending") => void) {
  bulkSetSection("summary", "rejected");
  bulkSetSection("skills", "rejected");
  bulkSetSection("experience", "rejected");
  bulkSetSection("projects", "rejected");
}
