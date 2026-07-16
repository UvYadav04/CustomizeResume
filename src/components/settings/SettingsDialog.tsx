import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAppStore } from "@/store/useAppStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ProvidersTab } from "./ProvidersTab";
import { SummaryTab } from "./SummaryTab";
import { SkillsTab } from "./SkillsTab";
import { TemplatesTab } from "./TemplatesTab";
import { Save } from "lucide-react";
import type { Resume, Settings } from "@/lib/types";

// Providers/Summary/Skills all edit local draft state here and only reach
// the store (and localStorage) when "Save changes" is clicked - same
// manual-save pattern the Templates tab already uses for its CSS/HTML.
// Opening the dialog always re-syncs the draft from whatever's currently
// saved, so closing without saving simply discards unsaved edits.
export function SettingsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const resume = useAppStore((s) => s.resume);
  const settings = useAppStore((s) => s.settings);
  const setResume = useAppStore((s) => s.setResume);
  const setSettings = useAppStore((s) => s.setSettings);

  const [draftResume, setDraftResume] = useState<Resume>(resume);
  const [draftSettings, setDraftSettings] = useState<Settings>(settings);

  useEffect(() => {
    if (open) {
      setDraftResume(resume);
      setDraftSettings(settings);
    }
    // Only re-sync when the dialog transitions open - not on every store
    // change, or typing in one field would get clobbered by unrelated state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const isDirty = JSON.stringify(draftResume) !== JSON.stringify(resume) || JSON.stringify(draftSettings) !== JSON.stringify(settings);

  async function handleSave() {
    await setResume(draftResume);
    await setSettings(draftSettings);
    toast.success("Settings saved.");
  }

  function handleDiscard() {
    setDraftResume(resume);
    setDraftSettings(settings);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Providers, master resume content, and resume templates.</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="providers">
          <TabsList>
            <TabsTrigger value="providers">Providers</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>
          <TabsContent value="providers">
            <ProvidersTab settings={draftSettings} onChange={setDraftSettings} />
          </TabsContent>
          <TabsContent value="summary">
            <SummaryTab
              resume={draftResume}
              onResumeChange={setDraftResume}
              settings={draftSettings}
              onSettingsChange={setDraftSettings}
            />
          </TabsContent>
          <TabsContent value="skills">
            <SkillsTab resume={draftResume} onResumeChange={setDraftResume} />
          </TabsContent>
          <TabsContent value="templates">
            {/* The default-template picker shares this dialog's draft/Save
                flow; the per-template HTML/CSS editor below it manages its
                own separate draft + Save, since each template's content is
                saved independently. */}
            <TemplatesTab settings={draftSettings} onSettingsChange={setDraftSettings} />
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-between border-t pt-3">
          <span className="text-[11px] text-muted-foreground">
            {isDirty ? "You have unsaved changes on Providers/Summary/Skills." : "Nothing to save."}
          </span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleDiscard} disabled={!isDirty}>
              Discard
            </Button>
            <Button size="sm" onClick={handleSave} disabled={!isDirty}>
              <Save className="h-3.5 w-3.5" /> Save changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
