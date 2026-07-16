import { useEffect, useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";

// Fixes a class of bug where a controlled textarea's `value` is derived by
// parsing the text into structured data and formatting it back
// (e.g. "Python, React" -> [{name:"Python"},{name:"React"}] -> "Python, React").
// Doing that re-derivation on every keystroke means an in-progress token
// (a trailing comma, a trailing space, a half-typed "**") gets silently
// dropped before the person can finish typing it, because the parser
// discards anything that doesn't look like a complete item yet.
//
// This component keeps its own local draft while focused, and only calls
// `onCommit` (which does the parse-and-save) on blur. It re-syncs from the
// external `value` whenever the field isn't focused, so it still reflects
// outside changes (e.g. switching which resume is loaded).
export function SyncedTextarea({
  value,
  onCommit,
  ...props
}: {
  value: string;
  onCommit: (text: string) => void;
} & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onChange" | "onBlur" | "onFocus">) {
  const [draft, setDraft] = useState(value);
  const isFocused = useRef(false);

  useEffect(() => {
    if (!isFocused.current) {
      setDraft(value);
    }
  }, [value]);

  return (
    <Textarea
      {...props}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onFocus={() => {
        isFocused.current = true;
      }}
      onBlur={() => {
        isFocused.current = false;
        onCommit(draft);
      }}
    />
  );
}
