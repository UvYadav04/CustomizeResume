import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SyncedTextarea } from "./SyncedTextarea";
import { clone } from "@/lib/utils";
import type { Resume, Settings } from "@/lib/types";

// Draft-only, like ProvidersTab - changes here update the dialog's local
// draft state (see SettingsDialog.tsx), not the store/localStorage directly.
export function SummaryTab({
  resume,
  onResumeChange,
  settings,
  onSettingsChange
}: {
  resume: Resume;
  onResumeChange: (next: Resume) => void;
  settings: Settings;
  onSettingsChange: (next: Settings) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Full name</Label>
          <Input value={resume.name} onChange={(e) => onResumeChange({ ...resume, name: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input
            value={resume.contact.email || ""}
            onChange={(e) => onResumeChange({ ...resume, contact: { ...resume.contact, email: e.target.value } })}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Phone</Label>
          <Input
            value={resume.contact.phone || ""}
            onChange={(e) => onResumeChange({ ...resume, contact: { ...resume.contact, phone: e.target.value } })}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Location</Label>
          <Input
            value={resume.contact.location || ""}
            onChange={(e) => onResumeChange({ ...resume, contact: { ...resume.contact, location: e.target.value } })}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Links (label|url per line)</Label>
        <SyncedTextarea
          className="min-h-[80px] font-mono text-xs"
          value={(resume.contact.links || []).map((l) => `${l.label}|${l.url}`).join("\n")}
          onCommit={(text) => {
            const links = text
              .split("\n")
              .map((line) => line.split("|"))
              .filter((parts) => parts.length === 2 && parts[0].trim() && parts[1].trim())
              .map(([label, url]) => ({ label: label.trim(), url: url.trim() }));
            onResumeChange({ ...resume, contact: { ...resume.contact, links } });
          }}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Master summary</Label>
        <Textarea
          className="min-h-[100px] text-sm"
          value={resume.summary}
          onChange={(e) => onResumeChange({ ...resume, summary: e.target.value })}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Skill whitelist (optional — comma or newline separated)</Label>
        <SyncedTextarea
          className="min-h-[70px] text-xs"
          placeholder="Only prioritize bolding these skills, e.g. Python, LangChain, System Design"
          value={settings.skillWhitelist.join(", ")}
          onCommit={(text) => {
            const next = clone(settings);
            next.skillWhitelist = text
              .split(/[\n,]/)
              .map((v) => v.trim())
              .filter(Boolean);
            onSettingsChange(next);
          }}
        />
      </div>
    </div>
  );
}
