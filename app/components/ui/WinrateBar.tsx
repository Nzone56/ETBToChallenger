import { cn } from "@/app/lib/utils";
import { formatWinrate } from "@/app/lib/format";

interface WinrateBarProps {
  wins: number;
  losses: number;
  className?: string;
  showLabel?: boolean;
}

/** Wins against losses as one split bar. */
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
        <div className="num mb-1.5 flex items-baseline justify-between text-xs">
          <span className="text-win">{wins}W</span>
          <span className="font-medium text-foreground">
            {formatWinrate(winrate)}
          </span>
          <span className="text-loss">{losses}L</span>
        </div>
      )}
      <div
        className="flex h-1.5 w-full gap-0.5 overflow-hidden rounded-full"
        role="img"
        aria-label={`${wins} wins, ${losses} losses`}
      >
        {total === 0 ? (
          <div className="h-full w-full bg-muted" />
        ) : (
          <>
            <div
              className="grow-x h-full rounded-full bg-win"
              style={{ width: `${winrate}%` }}
            />
            <div className="h-full flex-1 rounded-full bg-loss/40" />
          </>
        )}
      </div>
    </div>
  );
}
