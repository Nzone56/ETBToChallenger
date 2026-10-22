import { ArrowRight, TrendingDown } from "lucide-react";
import { cn } from "@/app/lib/utils";
import DossierPanel from "./DossierPanel";

export interface DrainRow {
  key: string;
  teammate: string;
  without: number;
  with: number;
  /** Positive = worse with Rukawa */
  drain: number;
  withoutSub?: string;
  withSub?: string;
}

interface DrainListProps {
  title: string;
  description: string;
  calloutLabel: string;
  rows: DrainRow[];
  format: (v: number) => string;
  limit?: number;
}

/** "Without Rukawa → with Rukawa" for each teammate, biggest drain first. */
export default function DrainList({ title, description, calloutLabel, rows, format, limit = 6 }: DrainListProps) {
  const sorted = [...rows].sort((a, b) => b.drain - a.drain);
  const top = sorted[0];

  return (
    <DossierPanel icon={TrendingDown} title={title} description={description}>
      {top && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-loss/30 bg-loss/5 px-4 py-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-loss">{calloutLabel}</p>
            <p className="font-display text-xl font-semibold">{top.teammate}</p>
          </div>
          <p className="num font-display text-3xl font-semibold text-loss">−{format(top.drain)}</p>
        </div>
      )}
      <ul className="divide-y divide-border">
        {sorted.slice(0, limit).map((r) => (
          <li key={r.key} className="flex items-center gap-4 py-2.5">
            <span className="min-w-0 flex-1 truncate text-sm font-medium">{r.teammate}</span>
            <span className="num w-16 text-right text-sm text-win">
              {format(r.without)}
              {r.withoutSub && <span className="block text-[10px] text-faint">{r.withoutSub}</span>}
            </span>
            <ArrowRight className="size-3.5 text-dossier" />
            <span className="num w-16 text-sm text-loss">
              {format(r.with)}
              {r.withSub && <span className="block text-[10px] text-faint">{r.withSub}</span>}
            </span>
            <span className={cn("num w-16 text-right font-display text-sm font-semibold", r.drain > 0 ? "text-loss" : "text-win")}>
              {r.drain > 0 ? "−" : "+"}
              {format(Math.abs(r.drain))}
            </span>
          </li>
        ))}
      </ul>
    </DossierPanel>
  );
}
