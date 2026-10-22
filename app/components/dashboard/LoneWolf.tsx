import { Sparkles } from "lucide-react";
import type { LoneWolfEntry } from "@/app/lib/db";
import { Panel, PanelHeader } from "@/app/components/ui/Panel";
import ProfileIcon from "@/app/components/ui/ProfileIcon";
import RankNumber from "@/app/components/ui/RankNumber";

interface LoneWolfProps {
  entries: LoneWolfEntry[];
  version: string;
}

/**
 * "Divas": who keeps queueing without the team. A solo game is worth 5
 * points, a duo 1. A team challenge, played alone.
 */
export default function LoneWolf({ entries, version }: LoneWolfProps) {
  const rows = [...entries]
    .filter((e) => e.score > 0 || e.soloGames > 0 || e.duoGames > 0)
    .sort((a, b) => b.score - a.score);

  if (rows.length === 0) return null;

  return (
    <Panel className="h-full">
      <PanelHeader
        icon={Sparkles}
        iconClassName="text-pillar-pressure"
        title="Divas 💅"
        description="Solo games 5 pts · duo games 1 pt"
      />
      <ol className="divide-y divide-border">
        {rows.map((e, i) => (
          <li key={e.puuid} className="flex items-center gap-3 px-4 py-2.5">
            <RankNumber position={i + 1} variant="worst" />
            <ProfileIcon iconId={e.profileIconId} version={version} size={26} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{e.gameName}</span>
              <span className="num block text-xs text-faint">
                {e.soloGames} solo · {e.duoGames} duo
              </span>
            </span>
            <span className="num w-12 text-right font-display text-sm font-semibold">
              {e.score}
              <span className="ml-0.5 text-[10px] font-normal text-faint">pts</span>
            </span>
          </li>
        ))}
      </ol>
    </Panel>
  );
}
