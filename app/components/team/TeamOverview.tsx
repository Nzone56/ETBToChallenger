import { PlayerAggregatedStats } from "@/app/types/riot";
import { formatWinrate } from "@/app/lib/helpers";
import StatCard from "@/app/components/ui/StatCard";
import ChampionIcon from "@/app/components/ui/ChampionIcon";
import { Users, Swords, Shield, Target } from "lucide-react";

interface TeamOverviewProps {
  players: { gameName: string; stats: PlayerAggregatedStats }[];
  totalGroupMatches: number;
  groupWins: number;
  version: string;
}

export default function TeamOverview({
  players,
  totalGroupMatches,
  groupWins,
  version,
}: TeamOverviewProps) {
  // Team-wide totals
  const totalGames = players.reduce((s, p) => s + p.stats.totalGames, 0);
  const totalWins = players.reduce((s, p) => s + p.stats.wins, 0);
  const teamWinrate = totalGames > 0 ? (totalWins / totalGames) * 100 : 0;

  // Team signature champions (most played across all players)
  const champTotals = new Map<string, { games: number; wins: number }>();
  for (const { stats } of players) {
    for (const champ of stats.championStats) {
      const existing = champTotals.get(champ.championName) ?? {
        games: 0,
        wins: 0,
      };
      existing.games += champ.games;
      existing.wins += champ.wins;
      champTotals.set(champ.championName, existing);
    }
  }
  const signatureChamps = Array.from(champTotals.entries())
    .map(([name, d]) => ({ name, ...d, winrate: (d.wins / d.games) * 100 }))
    .sort((a, b) => b.games - a.games)
    .slice(0, 5);

  const groupWinrate =
    totalGroupMatches > 0 ? (groupWins / totalGroupMatches) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Team Games"
          value={totalGames}
          sublabel={`${totalWins}W ${totalGames - totalWins}L`}
          icon={<Users className="h-3.5 w-3.5" />}
        />
        <StatCard
          label="Team Winrate"
          value={formatWinrate(teamWinrate)}
          sublabel="Individual avg"
          icon={<Target className="h-3.5 w-3.5" />}
        />
        <StatCard
          label="Stack Games"
          value={totalGroupMatches}
          sublabel={`${groupWins}W ${totalGroupMatches - groupWins}L`}
          icon={<Shield className="h-3.5 w-3.5" />}
        />
        <StatCard
          label="Stack Winrate"
          value={formatWinrate(groupWinrate)}
          sublabel="When 2+ play together"
          icon={<Swords className="h-3.5 w-3.5" />}
        />
      </div>

      {/* Signature Champions */}
      {signatureChamps.length > 0 && (
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Team Signature Champions
          </h3>
          <div className="flex flex-wrap gap-2">
            {signatureChamps.map((champ) => (
              <div
                key={champ.name}
                className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm"
              >
                <ChampionIcon
                  championName={champ.name}
                  version={version}
                  size={24}
                />
                <span className="font-medium text-zinc-200">{champ.name}</span>
                <span className="ml-1 text-xs text-zinc-500">
                  {champ.games}G · {formatWinrate(champ.winrate)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
