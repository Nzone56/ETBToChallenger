import { Users } from "lucide-react";
import type { CirRoleEntry } from "@/app/lib/db";
import { BEST_ROSTER_MIN_GAMES, solveBestRoster } from "@/app/lib/bestRoster";
import { getCirTier } from "@/app/lib/cirUtils";
import { Panel, PanelHeader } from "@/app/components/ui/Panel";
import ProfileIcon from "@/app/components/ui/ProfileIcon";
import { ROLE_META } from "@/app/components/ui/RoleIcon";
import { cn } from "@/app/lib/utils";

interface BestRosterProps {
  entries: CirRoleEntry[];
  players: { gameName: string; profileIconId: number | null }[];
  version: string;
}

/** The ideal five: highest combined CIR, one player per role. */
export default function BestRoster({ entries, players, version }: BestRosterProps) {
  const slots = solveBestRoster(entries);
  const filled = slots.filter((s) => s.pick);
  if (filled.length === 0) return null;

  const iconMap = new Map(players.map((p) => [p.gameName, p.profileIconId]));
  const teamAvg = filled.reduce((s, r) => s + r.pick!.avgCir, 0) / filled.length;
  const teamTier = getCirTier(teamAvg);

  return (
    <Panel>
      <PanelHeader
        icon={Users}
        title="Best roster"
        description={`Highest combined avg CIR · min. ${BEST_ROSTER_MIN_GAMES} games in role`}
        actions={
          <span className={cn("num font-display text-lg font-semibold", teamTier.text)} title="Lineup average CIR">
            {teamAvg.toFixed(1)}
          </span>
        }
      />
      <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-5">
        {slots.map(({ role, pick }) => {
          const meta = ROLE_META[role];
          const Icon = meta.icon;
          const tier = pick ? getCirTier(pick.avgCir) : null;
          return (
            <div
              key={role}
              className="flex flex-col items-center gap-2 rounded-lg border border-border bg-raised/60 px-3 py-4 text-center"
            >
              <span className={cn("flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider", meta.text)}>
                <Icon className="size-3.5" />
                {meta.label}
              </span>
              {pick ? (
                <>
                  <ProfileIcon iconId={iconMap.get(pick.gameName) ?? null} version={version} size={48} />
                  <span className="w-full truncate text-sm font-semibold">{pick.gameName}</span>
                  <span className={cn("num font-display text-xl font-semibold leading-none", tier!.text)}>
                    {pick.avgCir.toFixed(1)}
                  </span>
                  <span className="text-[11px] text-faint">
                    {tier!.label} · {pick.games}G
                  </span>
                </>
              ) : (
                <span className="py-6 text-xs italic text-faint">Nobody qualifies</span>
              )}
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
