import type { SkillItem } from "./types";

// Shared comma-separated <-> SkillItem[] conversion, used anywhere a skill
// list is edited as free text: "Python, **LangChain**, RAG" <->
// [{name:"Python",bold:false},{name:"LangChain",bold:true},{name:"RAG",bold:false}].
// Wrapping a name in ** marks it bold by default. Originally lived only in
// SkillsTab.tsx; pulled out so the Review panel's editable skill lists can
// reuse the exact same parsing.
export function itemsToText(items: SkillItem[] = []) {
  return items.map((item) => (item.bold ? `**${item.name}**` : item.name)).join(", ");
}

export function textToItems(text: string): SkillItem[] {
  return text
    .split(",")
    .map((raw) => raw.trim())
    .filter(Boolean)
    .map((raw) => {
      const bold = raw.startsWith("**") && raw.endsWith("**");
      const name = bold ? raw.slice(2, -2).trim() : raw;
      return { name, bold };
    })
    .filter((item) => item.name);
}
