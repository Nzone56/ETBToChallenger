import { Coins, Crosshair, Wheat } from "lucide-react";
import { formatCompact } from "@/app/lib/format";
import { cn } from "@/app/lib/utils";

interface MatchStatsProps {
  cs: number;
  gold: number;
  damage: number;
  className?: string;
}

/** CS · gold · damage, one compact line under a match. */
export default function MatchStats({ cs, gold, damage, className }: MatchStatsProps) {
  const items = [
    { icon: Wheat, value: cs.toString(), label: "CS" },
    { icon: Coins, value: formatCompact(gold), label: "Gold" },
    { icon: Crosshair, value: formatCompact(damage), label: "Damage" },
  ];
  return (
    <div className={cn("num flex items-center gap-3 text-xs text-muted-foreground", className)}>
      {items.map(({ icon: Icon, value, label }) => (
        <span key={label} className="flex items-center gap-1" title={label}>
          <Icon className="size-3 text-faint" />
          {value}
        </span>
      ))}
    </div>
  );
}
