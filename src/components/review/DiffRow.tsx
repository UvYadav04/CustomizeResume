import { Check, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { SyncedTextarea } from "@/components/settings/SyncedTextarea";
import type { SelectionState } from "@/lib/types";

interface DiffRowProps {
  label?: string;
  current: React.ReactNode;
  suggested: React.ReactNode;
  // When both are provided, the suggested box becomes an editable textarea
  // instead of static text - lets the person tweak a suggestion (add a
  // word, fix a phrase) instead of only accepting it verbatim. Whether the
  // edit actually lands in the exported resume still depends on
  // accept/reject state, same as before.
  suggestedText?: string;
  onSuggestedTextChange?: (value: string) => void;
  reason?: string;
  state: SelectionState;
  onAccept: () => void;
  onReject: () => void;
  identical?: boolean;
}

export function DiffRow({
  label,
  current,
  suggested,
  suggestedText,
  onSuggestedTextChange,
  reason,
  state,
  onAccept,
  onReject,
  identical
}: DiffRowProps) {
  const isEditable = suggestedText !== undefined && Boolean(onSuggestedTextChange);

  return (
    <div className={cn("rounded-md border p-2.5 text-sm", state === "accepted" && "border-success/40 bg-success/5", state === "rejected" && "opacity-60")}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1 space-y-1.5">
          {label && <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</div>}
          {!identical && (
            <div className="rounded bg-muted/60 px-2 py-1 text-xs text-muted-foreground line-through decoration-muted-foreground/40">
              {current}
            </div>
          )}
          {isEditable ? (
            <div className="relative">
              <SyncedTextarea
                value={suggestedText || ""}
                onCommit={onSuggestedTextChange!}
                className="min-h-[44px] rounded bg-accent/60 px-2 py-1 text-xs text-accent-foreground"
              />
              <Pencil className="pointer-events-none absolute right-1.5 top-1.5 h-3 w-3 text-accent-foreground/40" />
            </div>
          ) : (
            <div className="rounded bg-accent/60 px-2 py-1 text-xs text-accent-foreground">{suggested}</div>
          )}
          {reason && <div className="text-[11px] italic text-muted-foreground">{reason}</div>}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            size="icon"
            variant={state === "accepted" ? "success" : "outline"}
            className="h-7 w-7"
            onClick={onAccept}
            title="Accept suggestion"
          >
            <Check className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant={state === "rejected" ? "destructive" : "outline"}
            className="h-7 w-7"
            onClick={onReject}
            title="Keep original"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      {state !== "pending" && (
        <Badge variant={state === "accepted" ? "success" : "secondary"} className="mt-2">
          {state === "accepted" ? "Accepted" : "Rejected"}
        </Badge>
      )}
    </div>
  );
}
