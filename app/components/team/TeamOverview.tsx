import { Shield, Swords, Target, Users } from "lucide-react";
import ChampionIcon from "@/app/components/ui/ChampionIcon";
import { Panel, PanelHeader } from "@/app/components/ui/Panel";
import StatTile from "@/app/components/ui/StatTile";
import { formatWinrate } from "@/app/lib/format";
import { cn } from "@/app/lib/utils";
import { PlayerAggregatedStats } from "@/app/types/riot";

interface TeamOverviewProps {
  players: { gameName: string; stats: PlayerAggregatedStats }[];
  totalGroupMatches: number;
  groupWins: number;
  version: string;
}

/** Team-wide totals, stacked vs. not, and the champions the team leans on. */
export default function TeamOverview({ players, totalGroupMatches, groupWins, version }: TeamOverviewProps) {
  const totalGames = players.reduce((s, p) => s + p.stats.totalGames, 0);
  const totalWins = players.reduce((s, p) => s + p.stats.wins, 0);
  const teamWinrate = totalGames > 0 ? (totalWins / totalGames) * 100 : 0;
  const groupWinrate = totalGroupMatches > 0 ? (groupWins / totalGroupMatches) * 100 : 0;

  const champTotals = new Map<string, { games: number; wins: number }>();
  for (const { stats } of players) {
    for (const c of stats.championStats) {
      const t = champTotals.get(c.championName) ?? { games: 0, wins: 0 };
      t.games += c.games;
      t.wins += c.wins;
      champTotals.set(c.championName, t);
    }
  }
  const signature = [...champTotals.entries()]
    .map(([name, d]) => ({ name, ...d, winrate: (d.wins / d.games) * 100 }))
    .sort((a, b) => b.games - a.games)
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile icon={Users} label="Team games" value={totalGames} sub={`${totalWins}W ${totalGames - totalWins}L`} />
        <StatTile icon={Target} label="Team winrate" value={formatWinrate(teamWinrate)} sub="Every game, every player" valueClassName={teamWinrate >= 50 ? "text-win" : "text-loss"} />
        <StatTile icon={Shield} label="Stacked games" value={totalGroupMatches} sub={`${groupWins}W ${totalGroupMatches - groupWins}L`} />
        <StatTile icon={Swords} label="Stacked winrate" value={formatWinrate(groupWinrate)} sub="Two or more of us in the game" valueClassName={groupWinrate >= 50 ? "text-win" : "text-loss"} />
      </div>

      {signature.length > 0 && (
        <Panel>
          <PanelHeader title="Signature champions" description="Most played across the roster" />
          <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3 xl:grid-cols-6">
            {signature.map((c) => (
              <div key={c.name} className="flex items-center gap-3 rounded-lg border border-border bg-raised/60 p-3">
                <ChampionIcon championName={c.name} version={version} size={40} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{c.name}</p>
                  <p className="num text-xs text-muted-foreground">
                    {c.games}G ·{" "}
                    <span className={cn(c.winrate >= 50 ? "text-win" : "text-loss")}>{formatWinrate(c.winrate)}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}
