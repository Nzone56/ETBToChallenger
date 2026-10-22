import { cn } from "@/app/lib/utils";
import type { MatchParticipant } from "@/app/types/riot";

type ItemSlots = Pick<
  MatchParticipant,
  "item0" | "item1" | "item2" | "item3" | "item4" | "item5" | "item6"
>;

interface ItemsDisplayProps {
  participant: ItemSlots;
  version: string;
  size?: "sm" | "md";
  className?: string;
}

function itemUrl(id: number, version: string) {
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${id}.png`;
}

/** Six item slots plus the trinket, which wears a gold ring. */
export default function ItemsDisplay({
  participant: p,
  version,
  size = "md",
  className,
}: ItemsDisplayProps) {
  const items = [p.item0, p.item1, p.item2, p.item3, p.item4, p.item5];
  const box = size === "sm" ? "size-6" : "size-7";

  return (
    <div className={cn("flex gap-0.5", className)}>
      {items.map((id, i) => (
        <div
          key={i}
          className={cn(box, "shrink-0 overflow-hidden rounded-sm bg-muted ring-1 ring-border")}
        >
          {id > 0 && (
            <img src={itemUrl(id, version)} alt="" className="size-full" loading="lazy" />
          )}
        </div>
      ))}
      {p.item6 > 0 && (
        <div
          className={cn(box, "ml-1 shrink-0 overflow-hidden rounded-full ring-1 ring-primary/40")}
        >
          <img src={itemUrl(p.item6, version)} alt="" className="size-full" loading="lazy" />
        </div>
      )}
    </div>
  );
}
