import { SyncedTextarea } from "@/components/settings/SyncedTextarea";
import { itemsToText, textToItems } from "@/lib/skillText";
import type { SkillItem } from "@/lib/types";

// Editable counterpart to SkillListPreview - renders the suggested skill
// list as a comma-separated textarea (same "Python, **LangChain**" syntax
// as Settings > Skills) so a skill can be deleted or added without leaving
// the Review panel. Commits the parsed list back on blur via SyncedTextarea,
// same pattern used everywhere else a skill list is hand-edited.
export function EditableSkillList({ items, onChange }: { items: SkillItem[]; onChange: (items: SkillItem[]) => void }) {
  return (
    <SyncedTextarea
      value={itemsToText(items)}
      onCommit={(text) => onChange(textToItems(text))}
      className="min-h-[44px] rounded bg-accent/60 px-2 py-1 text-xs text-accent-foreground"
    />
  );
}
