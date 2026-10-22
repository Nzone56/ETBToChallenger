import { Trophy } from "lucide-react";
import { Panel, PanelHeader } from "@/app/components/ui/Panel";
import ProfileIcon from "@/app/components/ui/ProfileIcon";
import RankNumber from "@/app/components/ui/RankNumber";
import { type PlayerData, SORT_OPTIONS, computeRanks } from "./rankingUtils";

interface FinalRankingsProps {
  players: PlayerData[];
  version: string;
}

/** Overall standing: each player's average position across every category. */
export default function FinalRankings({ players, version }: FinalRankingsProps) {
  const allRanks = computeRanks(players);
  const total = SORT_OPTIONS.length;

  const rows = players
    .map((player) => {
      const ranks = allRanks.get(player.gameName)!;
      const rankOf = (key: (typeof SORT_OPTIONS)[number]["key"]) => ranks[key] ?? players.length;
      const avg = SORT_OPTIONS.reduce((acc, o) => acc + rankOf(o.key), 0) / total;
      const byRank = [...SORT_OPTIONS].sort((a, b) => rankOf(a.key) - rankOf(b.key));
      return {
        player,
        avg,
        best: byRank.slice(0, 3).map((o) => o.label),
        worst: byRank.slice(-3).reverse().map((o) => o.label),
      };
    })
    .sort((a, b) => a.avg - b.avg || b.player.stats.totalGames - a.player.stats.totalGames);

  return (
    <Panel>
      <PanelHeader icon={Trophy} title="Final rankings" description={`Average position across ${total} categories · lower is better`} />
      <ol className="divide-y divide-border">
        {rows.map(({ player, avg, best, worst }, i) => (
          <li key={player.gameName} className="flex items-center gap-4 px-5 py-3">
            <RankNumber position={i + 1} />
            <ProfileIcon iconId={player.profileIconId} version={version} size={32} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{player.gameName}</p>
              <p className="text-xs text-faint">{player.stats.totalGames} games</p>
            </div>
            <div className="hidden flex-col gap-1 text-right text-[11px] md:flex">
              <p>
                <span className="mr-1.5 text-faint">Best at</span>
                <span className="text-win">{best.join(" · ")}</span>
              </p>
              <p>
                <span className="mr-1.5 text-faint">Worst at</span>
                <span className="text-loss">{worst.join(" · ")}</span>
              </p>
            </div>
            <div className="w-16 text-right">
              <p className="num font-display text-lg font-semibold leading-none">{avg.toFixed(2)}</p>
              <p className="mt-1 text-[10px] uppercase tracking-wider text-faint">avg rank</p>
            </div>
          </li>
        ))}
      </ol>
    </Panel>
  );
}
