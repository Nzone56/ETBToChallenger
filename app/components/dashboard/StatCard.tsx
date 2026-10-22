import RankNumber from "@/app/components/ui/RankNumber";
import { RankedEntry } from "@/app/types/riot";
import { cn } from "@/app/lib/utils";
import type { CardConfig } from "./statCardConfigs";

interface StatCardProps {
  config: CardConfig;
  entries: RankedEntry[];
  variant: "best" | "worst";
}

/** One superlative: the leader large, second and third beneath. */
export default function StatCard({ config, entries, variant }: StatCardProps) {
  const [first, ...rest] = entries;
  const Icon = config.icon;
  const label = variant === "best" ? config.label : config.worstLabel;

  return (
    <div className="relative flex flex-col rounded-lg border border-border bg-raised/60 p-4">
      <span
        className={cn(
          "absolute inset-x-4 top-0 h-px",
          variant === "best" ? "bg-primary/50" : "bg-loss/50",
        )}
      />
      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        <Icon className={cn("size-3.5", variant === "best" ? "text-primary" : "text-loss")} />
        <span className="truncate">{label}</span>
      </div>

      {first ? (
        <>
          <p className="num mt-3 truncate font-display text-2xl font-semibold leading-none">
            {config.format(first)}
          </p>
          <p className="mt-2 truncate text-sm font-medium text-foreground">{first.gameName}</p>
          <p className="text-xs text-faint">{config.sublabel(first)}</p>

          {rest.length > 0 && (
            <ol className="mt-3 space-y-1 border-t border-border pt-3">
              {rest.map((entry, i) => (
                <li key={entry.gameName + i} className="flex items-center gap-2 text-xs">
                  <RankNumber position={i + 2} variant={variant} className="w-4 text-xs" />
                  <span className="min-w-0 flex-1 truncate text-muted-foreground">{entry.gameName}</span>
                  <span className="num font-medium text-foreground">{config.format(entry)}</span>
                </li>
              ))}
            </ol>
          )}
        </>
      ) : (
        <p className="mt-3 text-sm text-faint">Not enough games</p>
      )}
    </div>
  );
}
