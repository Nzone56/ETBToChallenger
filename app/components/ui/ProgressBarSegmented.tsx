import { cn } from "@/app/lib/utils";
import {
  TIER_ORDER,
  TIER_COLORS,
  lpToProgress,
  tierWidthPercent,
  lpToTierLabel,
} from "@/app/data/constants";

interface ProgressBarSegmentedProps {
  currentLp: number;
  label?: string;
  sublabel?: string;
  compact?: boolean;
  className?: string;
}

export default function ProgressBarSegmented({
  currentLp,
  label,
  sublabel,
  compact = false,
  className,
}: ProgressBarSegmentedProps) {
  const progress = lpToProgress(currentLp);
  const barHeight = compact ? "h-2" : "h-3";
  const markerHeight = compact ? "h-3.5 w-0.5" : "h-5 w-1";
  const tierLabel = lpToTierLabel(currentLp);

  return (
    <div className={cn("w-full", className)}>
      {/* Label row */}
      {(label || sublabel) && (
        <div className="mb-1 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {label && (
              <span
                className={cn(
                  "font-medium text-zinc-300",
                  compact ? "text-xs" : "text-sm",
                )}
              >
                {label}
              </span>
            )}
            <span
              className={cn(
                "text-zinc-500",
                compact ? "text-[10px]" : "text-xs",
              )}
            >
              {tierLabel}
            </span>
          </div>
          {sublabel && (
            <span className="text-[10px] text-zinc-500">{sublabel}</span>
          )}
        </div>
      )}

      {/* Tier labels (only on non-compact) — proportional spacing */}
      {!compact && (
        <div className="mb-1 flex text-[10px] font-medium uppercase tracking-wider text-zinc-500">
          {TIER_ORDER.map((tier) => (
            <span
              key={tier}
              className="text-center"
              style={{
                width: `${tierWidthPercent(tier)}%`,
                color: TIER_COLORS[tier],
              }}
            >
              {tier.slice(0, 1)}
            </span>
          ))}
        </div>
      )}

      {/* Bar */}
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-full bg-zinc-800",
          barHeight,
        )}
      >
        {/* Segments — proportional widths, same color as fill but faded */}
        <div className="absolute inset-0 flex">
          {TIER_ORDER.map((tier) => (
            <div
              key={tier}
              className="h-full border-r border-zinc-700/50"
              style={{
                width: `${tierWidthPercent(tier)}%`,
                backgroundColor: `${TIER_COLORS[tier]}22`,
              }}
            />
          ))}
        </div>

        {/* Fill — uses tier colors proportionally */}
        <div
          className="absolute inset-0 rounded-full transition-all duration-700 ease-out"
          style={{ clipPath: `inset(0 ${100 - progress}% 0 0)` }}
        >
          <div className="flex h-full w-full">
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

        {/* Marker */}
        <div
          className={cn(
            "absolute top-1/2 -translate-y-1/2 rounded-full bg-white shadow-lg shadow-white/30",
            markerHeight,
          )}
          style={{ left: `${progress}%` }}
        />
      </div>
    </div>
  );
}
