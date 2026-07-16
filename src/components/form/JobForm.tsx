import { useState } from "react";
import { toast } from "sonner";
import { useAppStore } from "@/store/useAppStore";
import { ROLE_PRESETS } from "@/lib/constants";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles } from "lucide-react";

export function JobForm() {
  const jobDescription = useAppStore((s) => s.jobDescription);
  const setJobDescription = useAppStore((s) => s.setJobDescription);
  const generate = useAppStore((s) => s.generate);
  const isGenerating = useAppStore((s) => s.isGenerating);
  const [localError, setLocalError] = useState("");

  const canGenerate = jobDescription.roleType && jobDescription.title.trim() && jobDescription.text.trim().length > 40;

  async function handleCustomize() {
    setLocalError("");
    if (!jobDescription.title.trim()) {
      setLocalError("Add a job title.");
      return;
    }
    if (jobDescription.text.trim().length < 40) {
      setLocalError("Paste a fuller job description (at least a few sentences).");
      return;
    }
    try {
      await generate();
      toast.success("Suggestions generated. Review them in the middle panel.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Generation failed.");
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-4 py-3">
        <h2 className="text-sm font-semibold">Job details</h2>
        <p className="text-xs text-muted-foreground">Tell it about the role, then customize.</p>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-4 p-4">
          <div className="space-y-1.5">
            <Label htmlFor="role-type">Role type</Label>
            <Select value={jobDescription.roleType} onValueChange={(value) => setJobDescription({ roleType: value })}>
              <SelectTrigger id="role-type">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {ROLE_PRESETS.map((preset) => (
                  <SelectItem key={preset.id} value={preset.id}>
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">
              {ROLE_PRESETS.find((p) => p.id === jobDescription.roleType)?.description}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="job-title">Job title</Label>
            <Input
              id="job-title"
              placeholder="e.g. Senior AI Engineer"
              value={jobDescription.title}
              onChange={(e) => setJobDescription({ title: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="job-company">Company</Label>
              <Input
                id="job-company"
                placeholder="Company name"
                value={jobDescription.company}
                onChange={(e) => setJobDescription({ company: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="job-location">Location</Label>
              <Input
                id="job-location"
                placeholder="City, remote, etc."
                value={jobDescription.location}
                onChange={(e) => setJobDescription({ location: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="job-description">Job description</Label>
            <Textarea
              id="job-description"
              placeholder="Paste the full job description here…"
              className="min-h-[280px] text-xs leading-relaxed"
              value={jobDescription.text}
              onChange={(e) => setJobDescription({ text: e.target.value })}
            />
          </div>

          {localError && <p className="text-xs text-destructive">{localError}</p>}
        </div>
      </ScrollArea>

      <div className="border-t p-4">
        <Button className="w-full" disabled={isGenerating || !canGenerate} onClick={handleCustomize}>
          <Sparkles className="h-4 w-4" />
          {isGenerating ? "Customizing…" : "Customize"}
        </Button>
      </div>
    </div>
  );
}
