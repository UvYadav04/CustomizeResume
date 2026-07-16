import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SelectionState } from "@/lib/types";

interface DiffRowProps {
  label?: string;
  current: React.ReactNode;
  suggested: React.ReactNode;
  reason?: string;
  state: SelectionState;
  onAccept: () => void;
  onReject: () => void;
  identical?: boolean;
}

export function DiffRow({ label, current, suggested, reason, state, onAccept, onReject, identical }: DiffRowProps) {
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
          <div className="rounded bg-accent/60 px-2 py-1 text-xs text-accent-foreground">{suggested}</div>
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
