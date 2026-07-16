import { PROVIDER_DEFS, ACTIVE_PROVIDER_ORDER } from "@/lib/constants";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowUp } from "lucide-react";
import { clone } from "@/lib/utils";
import type { ProviderId, Settings } from "@/lib/types";

// Reads/writes the dialog-level draft settings (see SettingsDialog.tsx) -
// nothing here touches the store or localStorage directly. The dialog's
// "Save changes" button is what actually persists it.
export function ProvidersTab({ settings, onChange }: { settings: Settings; onChange: (next: Settings) => void }) {
  const orderedProviders = settings.providerOrder.filter((id) => ACTIVE_PROVIDER_ORDER.includes(id));

  function updateProvider(id: ProviderId, patch: Partial<(typeof settings.providers)[ProviderId]>) {
    const next = clone(settings);
    next.providers[id] = { ...next.providers[id], ...patch };
    onChange(next);
  }

  function moveProvider(id: ProviderId, direction: -1 | 1) {
    const next = clone(settings);
    const index = next.providerOrder.indexOf(id);
    const swapWith = index + direction;
    if (swapWith < 0 || swapWith >= next.providerOrder.length) return;
    [next.providerOrder[index], next.providerOrder[swapWith]] = [next.providerOrder[swapWith], next.providerOrder[index]];
    onChange(next);
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Generation tries providers in this order and falls back to the next one on failure. API keys are stored only in
        this browser's local storage, and only once you click <strong>Save changes</strong> below.
      </p>
      {orderedProviders.map((id, index) => {
        const def = PROVIDER_DEFS[id];
        const provider = settings.providers[id];
        return (
          <Card key={id}>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>
                  {index + 1}. {def.label}
                </CardTitle>
                <CardDescription>{def.requiresApiKey ? "Requires an API key" : "Local, no API key required"}</CardDescription>
              </div>
              <div className="flex items-center gap-1.5">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveProvider(id, -1)}>
                  <ArrowUp className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveProvider(id, 1)}>
                  <ArrowDown className="h-3.5 w-3.5" />
                </Button>
                <Switch checked={provider.enabled} onCheckedChange={(checked) => updateProvider(id, { enabled: checked })} />
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              {def.requiresApiKey && (
                <div className="space-y-1.5">
                  <Label>API key</Label>
                  <Input
                    type="password"
                    placeholder={`${def.label} API key`}
                    value={provider.apiKey}
                    onChange={(e) => updateProvider(id, { apiKey: e.target.value })}
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <Label>Model</Label>
                <Input value={provider.model} onChange={(e) => updateProvider(id, { model: e.target.value })} />
              </div>
              {id === "ollama" && (
                <div className="col-span-2 space-y-1.5">
                  <Label>Base URL</Label>
                  <Input
                    value={provider.baseUrl || ""}
                    onChange={(e) => updateProvider(id, { baseUrl: e.target.value })}
                    placeholder="http://localhost:11434"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Requires <code>OLLAMA_ORIGINS</code> set on the Ollama server so this site can call it.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
