import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAppStore } from "@/store/useAppStore";
import { getTemplates } from "@/lib/templates";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { clone } from "@/lib/utils";
import { Save } from "lucide-react";
import type { Settings } from "@/lib/types";

// The default-template picker is part of the same draft/Save-changes flow
// as Providers/Summary/Skills (see SettingsDialog.tsx) - it reads/writes
// `settings`/`onSettingsChange` props, NOT the store directly, so it can't
// silently save behind the dialog's Save button's back (or get clobbered by
// it). The per-template HTML/CSS editor below it is a separate, independent
// save flow (saveTemplateOverride/resetTemplateOverride) since each
// template's content is saved on its own.
export function TemplatesTab({
  settings,
  onSettingsChange
}: {
  settings: Settings;
  onSettingsChange: (next: Settings) => void;
}) {
  const templates = getTemplates();
  const templateOverrides = useAppStore((s) => s.templateOverrides);
  const saveTemplateOverride = useAppStore((s) => s.saveTemplateOverride);
  const resetTemplateOverride = useAppStore((s) => s.resetTemplateOverride);

  const [editingId, setEditingId] = useState(templates[0].id);
  const activeTemplate = templates.find((t) => t.id === editingId)!;
  const savedOverride = templateOverrides[editingId];

  // Draft state: what's in the boxes right now. Nothing here touches the
  // store/localStorage until "Save changes" is clicked, so typing (and
  // possible typos, incomplete tags, etc.) never affects the live preview
  // or gets persisted until you're ready.
  const [draftCss, setDraftCss] = useState(savedOverride?.css ?? activeTemplate.styles);
  const [draftHtml, setDraftHtml] = useState(savedOverride?.html ?? activeTemplate.defaultHtml);

  useEffect(() => {
    const override = templateOverrides[editingId];
    const template = templates.find((t) => t.id === editingId)!;
    setDraftCss(override?.css ?? template.styles);
    setDraftHtml(override?.html ?? template.defaultHtml);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingId]);

  const isDirty = draftCss !== (savedOverride?.css ?? activeTemplate.styles) || draftHtml !== (savedOverride?.html ?? activeTemplate.defaultHtml);

  function handleSave() {
    saveTemplateOverride(editingId, { css: draftCss, html: draftHtml });
    toast.success(`${activeTemplate.label} template saved.`);
  }

  function handleReset() {
    resetTemplateOverride(editingId);
    setDraftCss(activeTemplate.styles);
    setDraftHtml(activeTemplate.defaultHtml);
    toast.success(`${activeTemplate.label} reset to default.`);
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

      <div className="flex flex-wrap gap-2">
        {templates.map((t) => (
          <button
            key={t.id}
            onClick={() => setEditingId(t.id)}
            className={`rounded-md border px-3 py-2 text-left text-xs ${editingId === t.id ? "border-primary bg-accent" : "border-border"}`}
          >
            <div className="font-medium">{t.label}</div>
            <div className="text-[11px] text-muted-foreground">{t.description}</div>
            {templateOverrides[t.id] && (
              <Badge variant="secondary" className="mt-1">
                Customized
              </Badge>
            )}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Editing — {activeTemplate.label}</Label>
          <div className="flex items-center gap-2">
            {isDirty && <span className="text-[11px] text-muted-foreground">Unsaved changes</span>}
            {savedOverride && (
              <Button variant="ghost" size="sm" onClick={handleReset}>
                Reset to default
              </Button>
            )}
            <Button size="sm" onClick={handleSave} disabled={!isDirty}>
              <Save className="h-3.5 w-3.5" /> Save changes
            </Button>
          </div>
        </div>

        <Tabs defaultValue="html">
          <TabsList>
            <TabsTrigger value="html">HTML content</TabsTrigger>
            <TabsTrigger value="css">Style (CSS)</TabsTrigger>
          </TabsList>
          <TabsContent value="html">
            <Textarea
              className="min-h-[280px] font-mono text-[11px] leading-relaxed"
              value={draftHtml}
              onChange={(e) => setDraftHtml(e.target.value)}
              spellCheck={false}
            />
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              Uses a small safe template syntax, not raw JS: <code>{"{{field}}"}</code> for text,{" "}
              <code>{"{{{field}}}"}</code> for text that may contain <code>**bold**</code>,{" "}
              <code>{"{{#each list}}...{{/each}}"}</code> to repeat, and <code>{"{{#if flag}}...{{/if}}"}</code> to
              conditionally show something. Available fields: <code>name</code>, <code>summary</code>,{" "}
              <code>email/phone/location</code>, <code>links</code>, <code>skillCategories</code> (each has{" "}
              <code>category</code> + <code>items</code>), <code>experience</code>, <code>projects</code>, and{" "}
              <code>education</code>. A malformed tag just renders as empty — it won't break the app.
            </p>
          </TabsContent>
          <TabsContent value="css">
            <Textarea
              className="min-h-[280px] font-mono text-[11px] leading-relaxed"
              value={draftCss}
              onChange={(e) => setDraftCss(e.target.value)}
              spellCheck={false}
            />
          </TabsContent>
        </Tabs>

        <p className="text-[11px] text-muted-foreground">
          Nothing here affects the resume preview or downloaded PDF until you click <strong>Save changes</strong>.
        </p>
      </div>
    </div>
  );
}
