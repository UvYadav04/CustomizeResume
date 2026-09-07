import { getTemplates } from "@/lib/templates";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { clone } from "@/lib/utils";
import type { LayoutSettings, Settings } from "@/lib/types";

// Default-template picker and page-spacing controls, part of the same
// draft/Save-changes flow as Providers/Summary/Skills (see
// SettingsDialog.tsx) - reads/writes `settings`/`onSettingsChange` props,
// NOT the store directly, so it can't silently save behind the dialog's Save
// button's back (or get clobbered by it).
//
// The raw per-template HTML/CSS override editor that used to live here was
// removed per request - templates are no longer hand-editable from Settings,
// only selectable and adjustable via page spacing.
export function TemplatesTab({
  settings,
  onSettingsChange
}: {
  settings: Settings;
  onSettingsChange: (next: Settings) => void;
}) {
  const templates = getTemplates();

  function updateLayout(patch: Partial<LayoutSettings>) {
    onSettingsChange({ ...clone(settings), layout: { ...settings.layout, ...patch } });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Default template</Label>
        <Select value={settings.templateId} onValueChange={(value) => onSettingsChange({ ...clone(settings), templateId: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="auto">Auto (match selected role)</SelectItem>
            {templates.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-[11px] text-muted-foreground">
          "Auto" picks the AI Engineer template for AI-audience roles and the Software Engineer template for SDE-audience
          roles.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label>Page spacing</Label>
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <span className="text-[11px] text-muted-foreground">Top (mm)</span>
            <Input
              type="number"
              min={0}
              max={20}
              step={0.5}
              value={settings.layout.paddingTop}
              onChange={(e) => updateLayout({ paddingTop: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-1">
            <span className="text-[11px] text-muted-foreground">Left / Right (mm)</span>
            <Input
              type="number"
              min={5}
              max={25}
              step={0.5}
              value={settings.layout.paddingX}
              onChange={(e) => updateLayout({ paddingX: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-1">
            <span className="text-[11px] text-muted-foreground">Bottom (mm)</span>
            <Input
              type="number"
              min={0}
              max={25}
              step={0.5}
              value={settings.layout.paddingBottom}
              onChange={(e) => updateLayout({ paddingBottom: Number(e.target.value) })}
            />
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Controls page margins for both the preview/print output and the downloaded PDF. Applies once saved.
        </p>
      </div>
    </div>
  );
}
