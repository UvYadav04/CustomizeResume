import type { SkillItem } from "@/lib/types";

export function SkillListPreview({ items }: { items: SkillItem[] }) {
  if (!items?.length) {
    return <span className="italic text-muted-foreground/70">empty</span>;
  }
  return (
    <span>
      {items.map((item, index) => (
        <span key={item.name}>
          <span className={item.bold ? "font-semibold text-primary" : undefined}>{item.name}</span>
          {index < items.length - 1 ? ", " : ""}
        </span>
      ))}
    </span>
  );
}
