import { SKILL_CATEGORY_ORDER } from "@/lib/constants";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SyncedTextarea } from "./SyncedTextarea";
import type { Resume, SkillItem } from "@/lib/types";

// Skill categories are edited as a comma-separated list, e.g.
// "Python, **LangChain**, RAG" — wrap a name in ** to mark it bold by
// default (the tailoring step will still bold/unbold based on the JD).
function itemsToText(items: SkillItem[] = []) {
  return items.map((item) => (item.bold ? `**${item.name}**` : item.name)).join(", ");
}

function textToItems(text: string): SkillItem[] {
  return text
    .split(",")
    .map((raw) => raw.trim())
    .filter(Boolean)
    .map((raw) => {
      const bold = raw.startsWith("**") && raw.endsWith("**");
      const name = bold ? raw.slice(2, -2).trim() : raw;
      return { name, bold };
    })
    .filter((item) => item.name);
}

// Draft-only, like the other tabs - edits update the dialog's local draft
// resume (see SettingsDialog.tsx), not the store/localStorage directly.
// SyncedTextarea still commits on blur (so typing doesn't fight the parser),
// but that commit only updates the draft; nothing is persisted until the
// dialog's "Save changes" button is clicked.
export function SkillsTab({ resume, onResumeChange }: { resume: Resume; onResumeChange: (next: Resume) => void }) {
  const categories = Array.from(new Set([...SKILL_CATEGORY_ORDER, ...Object.keys(resume.skills || {})]));

  return (
    <ScrollArea className="h-[420px] pr-3">
      <div className="space-y-4">
        <p className="text-xs text-muted-foreground">
          One category per box, comma-separated. Wrap a skill in <code>**like this**</code> to mark it bold by default.
          Click <strong>Save changes</strong> below to persist edits.
        </p>
        {categories.map((category) => (
          <div key={category} className="space-y-1.5">
            <Label>{category}</Label>
            <SyncedTextarea
              className="min-h-[60px] text-xs"
              value={itemsToText(resume.skills[category] || [])}
              onCommit={(text) => {
                onResumeChange({
                  ...resume,
                  skills: { ...resume.skills, [category]: textToItems(text) }
                });
              }}
            />
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
