import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { DiffRow } from "./DiffRow";
import { SkillListPreview } from "./SkillListPreview";
import { EditableSkillList } from "./EditableSkillList";
import { CheckCheck, Sparkles, XCircle } from "lucide-react";
import { clone } from "@/lib/utils";

export function ReviewPanel() {
  const suggestions = useAppStore((s) => s.suggestions);
  const selections = useAppStore((s) => s.selections);
  const isGenerating = useAppStore((s) => s.isGenerating);
  const error = useAppStore((s) => s.error);
  const generationMeta = useAppStore((s) => s.generationMeta);
  const bulkSetSection = useAppStore((s) => s.bulkSetSection);
  const setPointSelection = useAppStore((s) => s.setPointSelection);
  const setSkillSelection = useAppStore((s) => s.setSkillSelection);
  const setExperienceSelection = useAppStore((s) => s.setExperienceSelection);
  const setProjectSelection = useAppStore((s) => s.setProjectSelection);
  const editSummarySuggestion = useAppStore((s) => s.editSummarySuggestion);
  const editSkillGroupSuggestion = useAppStore((s) => s.editSkillGroupSuggestion);
  const editExperiencePointSuggestion = useAppStore((s) => s.editExperiencePointSuggestion);
  const editExperienceSkillsUsedSuggestion = useAppStore((s) => s.editExperienceSkillsUsedSuggestion);
  const editProjectAboutSuggestion = useAppStore((s) => s.editProjectAboutSuggestion);
  const editProjectTechStackSuggestion = useAppStore((s) => s.editProjectTechStackSuggestion);

  if (isGenerating) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
        <Sparkles className="h-5 w-5 animate-pulse text-primary" />
        Tailoring your resume against the job description…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-sm">
        <XCircle className="h-5 w-5 text-destructive" />
        <p className="font-medium text-destructive">Generation failed</p>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (!suggestions || !selections) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-sm text-muted-foreground">
        <Sparkles className="h-5 w-5" />
        Fill in the job details on the left and click Customize to generate suggestions.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
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
            <SectionHeader title="Summary" onAccept={() => bulkSetSection("summary", "accepted")} onReject={() => bulkSetSection("summary", "rejected")} />
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
            <SectionHeader title="Skills" onAccept={() => bulkSetSection("skills", "accepted")} onReject={() => bulkSetSection("skills", "rejected")} />
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
            <SectionHeader title="Experience" onAccept={() => bulkSetSection("experience", "accepted")} onReject={() => bulkSetSection("experience", "rejected")} />
            {suggestions.experience.map((entry, entryIndex) => {
              const state = selections.experience[entryIndex];
              if (!state) return null;
              return (
                <div key={entry.companyName} className="space-y-2 rounded-md border border-dashed p-2.5">
                  <p className="text-xs font-semibold">{entry.companyName} · {entry.role}</p>
                  {entry.points.map((point, pointIndex) => (
                    <DiffRow
                      key={pointIndex}
                      current={point.current}
                      suggested={point.suggested}
                      suggestedText={point.suggested}
                      onSuggestedTextChange={(text) => editExperiencePointSuggestion(entryIndex, pointIndex, text)}
                      reason={point.reason}
                      state={state.points[pointIndex] || "pending"}
                      onAccept={() => {
                        const points = clone(state.points);
                        points[pointIndex] = "accepted";
                        setExperienceSelection(entryIndex, { points });
                      }}
                      onReject={() => {
                        const points = clone(state.points);
                        points[pointIndex] = "rejected";
                        setExperienceSelection(entryIndex, { points });
                      }}
                    />
                  ))}
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
                    current={project.about.current}
                    suggested={project.about.suggested}
                    suggestedText={project.about.suggested}
                    onSuggestedTextChange={(text) => editProjectAboutSuggestion(projectIndex, text)}
                    reason={project.about.reason}
                    state={state.about}
                    onAccept={() => setProjectSelection(projectIndex, { about: "accepted" })}
                    onReject={() => setProjectSelection(projectIndex, { about: "rejected" })}
                  />
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
