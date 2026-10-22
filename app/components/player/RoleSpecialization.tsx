import { Compass } from "lucide-react";
import { Panel, PanelHeader } from "@/app/components/ui/Panel";
import Meter from "@/app/components/ui/Meter";
import { ROLE_META, ROLE_ORDER } from "@/app/components/ui/RoleIcon";
import { getCirColor } from "@/app/lib/cirUtils";
import { formatWinrate } from "@/app/lib/format";
import { cn } from "@/app/lib/utils";
import { RoleStats } from "@/app/types/riot";

/** How a player's games split across roles, and how each role went. */
export default function RoleSpecialization({ roleStats }: { roleStats: RoleStats[] }) {
  if (roleStats.length === 0) return null;

  const roleMap = new Map(roleStats.map((r) => [r.position, r]));
  const totalGames = roleStats.reduce((s, r) => s + r.games, 0);

  return (
    <Panel>
      <PanelHeader icon={Compass} title="Roles" description="Share of games, winrate and CIR" />
      <ul className="space-y-4 p-5">
        {ROLE_ORDER.filter((pos) => roleMap.has(pos)).map((pos) => {
          const role = roleMap.get(pos)!;
          const meta = ROLE_META[pos];
          const Icon = meta.icon;
          const share = totalGames > 0 ? (role.games / totalGames) * 100 : 0;
          return (
            <li key={pos}>
              <div className="mb-1.5 flex items-center gap-2 text-sm">
                <Icon className={cn("size-4", meta.text)} />
                <span className="font-medium">{meta.label}</span>
                <span className="num ml-auto text-xs text-faint">
                  {role.games}G · {share.toFixed(0)}%
                </span>
              </div>
              <Meter value={share} fillClassName={meta.fill} label={`${meta.label} share of games`} />
              <div className="num mt-1.5 flex gap-3 text-xs">
                <span className={role.winrate >= 50 ? "text-win" : "text-loss"}>
                  {formatWinrate(role.winrate)} WR
                </span>
                {role.avgCir !== undefined && (
                  <span className={getCirColor(role.avgCir)}>{role.avgCir.toFixed(1)} CIR</span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
