interface ItemsDisplayProps {
  item0: number;
  item1: number;
  item2: number;
  item3: number;
  item4: number;
  item5: number;
  item6: number;
  version: string;
  size?: "sm" | "md";
}

export default function ItemsDisplay({
  item0,
  item1,
  item2,
  item3,
  item4,
  item5,
  item6,
  version,
  size = "md",
}: ItemsDisplayProps) {
  const regularItems = [item0, item1, item2, item3, item4, item5];
  const trinket = item6;

  const itemSize = size === "sm" ? "h-6 w-6" : "h-7 w-7";
  const imgSize = size === "sm" ? 24 : 28;

  return (
    <div className="flex gap-0.5">
      {regularItems.map((itemId, i) => (
        <div
          key={i}
          className={`${itemSize} rounded border border-zinc-700/60 bg-zinc-800/40 overflow-hidden shrink-0`}
        >
          {itemId > 0 && (
            <img
              src={`https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${itemId}.png`}
              alt={`Item ${itemId}`}
              width={imgSize}
              height={imgSize}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          )}
        </div>
      ))}
      {trinket > 0 && (
        <div
          className={`${itemSize} rounded border border-amber-600/40 bg-amber-900/10 overflow-hidden shrink-0`}
        >
          <img
            src={`https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${trinket}.png`}
            alt={`Trinket ${trinket}`}
            width={imgSize}
            height={imgSize}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
      )}
    </div>
  );
}
