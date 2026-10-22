import { cn } from "@/app/lib/utils";
import {
  TIER_ORDER,
  TIER_COLORS,
  lpToProgress,
  tierWidthPercent,
} from "@/app/data/constants";
import { formatTier } from "@/app/lib/format";

export interface TierPin {
  key: string;
  lp: number;
  title: string;
  node: React.ReactNode;
}

interface TierProgressBarProps {
  /** Ladder LP of the main marker (e.g. team average) */
  currentLp: number;
  /** Markers drawn above the track, e.g. each player's avatar */
  pins?: TierPin[];
  className?: string;
}

/**
 * The ladder from Iron to Challenger as one track, each tier as wide as its
 * LP span. Filled up to `currentLp`; `pins` sit above it at their own LP,
 * alternating between two rows so neighbours don't cover each other.
 */
export default function TierProgressBar({
  currentLp,
  pins = [],
  className,
}: TierProgressBarProps) {
  const progress = lpToProgress(currentLp);
  const sortedPins = [...pins].sort((a, b) => a.lp - b.lp);

  return (
    <div className={cn("w-full", className)}>
      {sortedPins.length > 0 && (
        <div className="relative mb-2 h-16" aria-hidden>
          {sortedPins.map((pin, i) => {
            const row = i % 2;
            return (
              <div
                key={pin.key}
                title={pin.title}
                className="absolute flex -translate-x-1/2 flex-col items-center"
                style={{ left: `${lpToProgress(pin.lp)}%`, top: row === 0 ? 0 : 26 }}
              >
                {pin.node}
                <span
                  className="w-px bg-border-strong"
                  style={{ height: row === 0 ? 34 : 8 }}
                />
              </div>
            );
          })}
        </div>
      )}

      <div
        className="relative h-3 w-full rounded-full bg-muted"
        role="meter"
        aria-label="Ladder progress toward Challenger"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        {/* Tier segments, faint */}
        <div className="absolute inset-0 flex gap-0.5 overflow-hidden rounded-full">
          {TIER_ORDER.map((tier) => (
            <div
              key={tier}
              className="h-full"
              style={{
                width: `${tierWidthPercent(tier)}%`,
                backgroundColor: `${TIER_COLORS[tier]}26`,
              }}
            />
          ))}
        </div>

        {/* Filled part, in each tier's own colour */}
        <div
          className="absolute inset-0 overflow-hidden rounded-full"
          style={{ clipPath: `inset(0 ${100 - progress}% 0 0)` }}
        >
          <div className="flex h-full w-full gap-0.5">
            {TIER_ORDER.map((tier) => (
              <div
                key={tier}
                className="h-full"
                style={{
                  width: `${tierWidthPercent(tier)}%`,
                  backgroundColor: TIER_COLORS[tier],
                }}
              />
            ))}
          </div>
        </div>

        {/* Current position */}
        <div
          className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[3px] border-2 border-background bg-foreground shadow-[0_0_0_3px_rgb(226_182_92/0.35)]"
          style={{ left: `${progress}%` }}
        />
      </div>

      {/* Tier names, aligned to their segments */}
      <div className="mt-2 flex text-[10px] font-medium uppercase tracking-wider">
        {TIER_ORDER.map((tier) => (
          <span
            key={tier}
            className="truncate text-center"
            style={{ width: `${tierWidthPercent(tier)}%`, color: TIER_COLORS[tier] }}
            title={formatTier(tier)}
          >
            <span className="hidden xl:inline">{formatTier(tier)}</span>
            <span className="xl:hidden">{tier.slice(0, 1)}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
