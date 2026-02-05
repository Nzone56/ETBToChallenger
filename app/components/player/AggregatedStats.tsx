import { PlayerAggregatedStats } from "@/app/types/riot";
import { formatKda } from "@/app/lib/helpers";
import StatCard from "@/app/components/ui/StatCard";
import { Crosshair, Sword, Eye, Coins } from "lucide-react";

interface AggregatedStatsProps {
  stats: PlayerAggregatedStats;
}

export default function AggregatedStats({ stats }: AggregatedStatsProps) {
  if (stats.totalGames === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 text-center text-sm text-zinc-500">
        No match data available to aggregate
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">
        Aggregated Stats
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Avg KDA"
          value={formatKda(stats.avgKda)}
          sublabel={`${stats.avgKills.toFixed(1)} / ${stats.avgDeaths.toFixed(1)} / ${stats.avgAssists.toFixed(1)}`}
          icon={<Crosshair className="h-3.5 w-3.5" />}
        />
        <StatCard
          label="CS/min"
          value={stats.avgCsPerMin.toFixed(1)}
          sublabel={`${stats.avgCs.toFixed(0)} avg CS`}
          icon={<Coins className="h-3.5 w-3.5" />}
        />
        <StatCard
          label="Avg Damage"
          value={Math.round(stats.avgDamage).toLocaleString()}
          sublabel="DMG to champions"
          icon={<Sword className="h-3.5 w-3.5" />}
        />
        <StatCard
          label="Vision Score"
          value={stats.avgVisionScore.toFixed(1)}
          sublabel="Average per game"
          icon={<Eye className="h-3.5 w-3.5" />}
        />
      </div>
    </div>
  );
}
