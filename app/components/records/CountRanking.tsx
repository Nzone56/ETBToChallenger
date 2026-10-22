import { Panel, PanelHeader } from "@/app/components/ui/Panel";
import RankNumber from "@/app/components/ui/RankNumber";
import { cn } from "@/app/lib/utils";

interface CountRankingProps {
  title: string;
  description: string;
  rows: [string, number][];
  unit: string;
  variant: "best" | "worst";
}

/** Players ranked by how many times something happened to them. */
export default function CountRanking({ title, description, rows, unit, variant }: CountRankingProps) {
  return (
    <Panel>
      <PanelHeader title={title} description={description} />
      {rows.length === 0 ? (
        <p className="px-5 py-6 text-sm text-faint">Nobody yet</p>
      ) : (
        <ol className="divide-y divide-border">
          {rows.map(([name, count], i) => (
            <li key={name} className="flex items-center gap-3 px-5 py-2">
              <RankNumber position={i + 1} variant={variant} />
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{name}</span>
              <span className={cn("num font-display text-sm font-semibold", variant === "best" ? "text-primary" : "text-loss")}>
                {count}
              </span>
              <span className="w-14 text-xs text-faint">{unit}</span>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}
