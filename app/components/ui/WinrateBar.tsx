import { cn } from "@/app/lib/utils";

interface WinrateBarProps {
  wins: number;
  losses: number;
  className?: string;
  showLabel?: boolean;
}

export default function WinrateBar({
  wins,
  losses,
  className,
  showLabel = true,
}: WinrateBarProps) {
  const total = wins + losses;
  const winrate = total > 0 ? (wins / total) * 100 : 0;

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="mb-1 flex justify-between text-xs">
          <span className="text-emerald-400">{wins}W</span>
          <span className="font-medium text-zinc-300">{winrate.toFixed(1)}%</span>
          <span className="text-red-400">{losses}L</span>
        </div>
      )}
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-red-900/50">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all duration-500"
          style={{ width: `${winrate}%` }}
        />
      </div>
    </div>
  );
}
