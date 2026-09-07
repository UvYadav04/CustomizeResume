import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SyncedTextarea } from "./SyncedTextarea";
import { clone } from "@/lib/utils";
import { ROLE_PRESETS, DEFAULT_ROLE_SUMMARIES } from "@/lib/constants";
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
        <Label>Master summary (fallback / general)</Label>
        <Textarea
          className="min-h-[100px] text-sm"
          value={resume.summary}
          onChange={(e) => onResumeChange({ ...resume, summary: e.target.value })}
        />
        <p className="text-[11px] text-muted-foreground">
          Used only for roles without a dedicated summary below. Wrap words in <code>**like this**</code> to bold
          them.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Per-role summaries</Label>
        <p className="-mt-1 text-[11px] text-muted-foreground">
          Each role starts from its own summary before the AI tailors it to a job description. Wrap words in{" "}
          <code>**like this**</code> to bold them.
        </p>
        {ROLE_PRESETS.map((role) => (
          <div key={role.id} className="space-y-1">
            <span className="text-xs font-medium">{role.label}</span>
            <Textarea
              className="min-h-[90px] text-sm"
              value={settings.roleSummaries[role.id] ?? DEFAULT_ROLE_SUMMARIES[role.id] ?? ""}
              onChange={(e) => {
                const next = clone(settings);
                next.roleSummaries = { ...next.roleSummaries, [role.id]: e.target.value };
                onSettingsChange(next);
              }}
            />
          </div>
        ))}
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
