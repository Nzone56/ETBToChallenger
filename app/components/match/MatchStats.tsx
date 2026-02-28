import { Match, MatchParticipant } from "@/app/types/riot";
import { Target, Eye, Crown } from "lucide-react";

interface MatchStatsProps {
  match: Match;
  challengeParticipants: MatchParticipant[];
}

export default function MatchStats({
  match,
  challengeParticipants,
}: MatchStatsProps) {
  const team100 = match.info.participants.filter((p) => p.teamId === 100);
  const team200 = match.info.participants.filter((p) => p.teamId === 200);

  // Calculate comprehensive team stats
  const team100Stats = {
    kills: team100.reduce((sum, p) => sum + p.kills, 0),
    deaths: team100.reduce((sum, p) => sum + p.deaths, 0),
    assists: team100.reduce((sum, p) => sum + p.assists, 0),
    damage: team100.reduce((sum, p) => sum + p.totalDamageDealtToChampions, 0),
    damageTaken: team100.reduce((sum, p) => sum + p.totalDamageTaken, 0),
    gold: team100.reduce((sum, p) => sum + p.goldEarned, 0),
    vision: team100.reduce((sum, p) => sum + p.visionScore, 0),
    cs: team100.reduce(
      (sum, p) => sum + p.totalMinionsKilled + p.neutralMinionsKilled,
      0,
    ),
    towers:
      match.info.teams.find((t) => t.teamId === 100)?.objectives.tower?.kills ??
      0,
    dragons:
      match.info.teams.find((t) => t.teamId === 100)?.objectives.dragon
        ?.kills ?? 0,
    barons:
      match.info.teams.find((t) => t.teamId === 100)?.objectives.baron?.kills ??
      0,
    heralds:
      match.info.teams.find((t) => t.teamId === 100)?.objectives.riftHerald
        ?.kills ?? 0,
  };

  const team200Stats = {
    kills: team200.reduce((sum, p) => sum + p.kills, 0),
    deaths: team200.reduce((sum, p) => sum + p.deaths, 0),
    assists: team200.reduce((sum, p) => sum + p.assists, 0),
    damage: team200.reduce((sum, p) => sum + p.totalDamageDealtToChampions, 0),
    damageTaken: team200.reduce((sum, p) => sum + p.totalDamageTaken, 0),
    gold: team200.reduce((sum, p) => sum + p.goldEarned, 0),
    vision: team200.reduce((sum, p) => sum + p.visionScore, 0),
    cs: team200.reduce(
      (sum, p) => sum + p.totalMinionsKilled + p.neutralMinionsKilled,
      0,
    ),
    towers:
      match.info.teams.find((t) => t.teamId === 200)?.objectives.tower?.kills ??
      0,
    dragons:
      match.info.teams.find((t) => t.teamId === 200)?.objectives.dragon
        ?.kills ?? 0,
    barons:
      match.info.teams.find((t) => t.teamId === 200)?.objectives.baron?.kills ??
      0,
    heralds:
      match.info.teams.find((t) => t.teamId === 200)?.objectives.riftHerald
        ?.kills ?? 0,
  };

  // Calculate challenge player contribution
  const challengeContribution = challengeParticipants.reduce(
    (acc, p) => ({
      kills: acc.kills + p.kills,
      damage: acc.damage + p.totalDamageDealtToChampions,
      gold: acc.gold + p.goldEarned,
      vision: acc.vision + p.visionScore,
    }),
    { kills: 0, damage: 0, gold: 0, vision: 0 },
  );

  const StatBar = ({
    label,
    team100Value,
    team200Value,
    format = (v: number) => v.toString(),
  }: {
    label: string;
    team100Value: number;
    team200Value: number;
    format?: (v: number) => string;
  }) => {
    const total = team100Value + team200Value;
    const team100Pct = total > 0 ? (team100Value / total) * 100 : 50;
    const team200Pct = total > 0 ? (team200Value / total) * 100 : 50;

    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-blue-400 tabular-nums">
            {format(team100Value)}
          </span>
          <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-600">
            {label}
          </span>
          <span className="font-bold text-red-400 tabular-nums">
            {format(team200Value)}
          </span>
        </div>
        <div className="flex h-1.5 rounded-full overflow-hidden bg-zinc-800">
          <div
            className="bg-blue-500 transition-all"
            style={{ width: `${team100Pct}%` }}
          />
          <div
            className="bg-red-500 transition-all"
            style={{ width: `${team200Pct}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/80 px-6 py-4">
        <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400">
          Team Comparison
        </h2>
        {challengeParticipants.length > 0 && (
          <p className="mt-1 text-xs text-zinc-600">
            Challenge players contributed {challengeContribution.kills} kills,{" "}
            {Math.round(challengeContribution.damage / 1000)}k damage
          </p>
        )}
      </div>

      <div className="p-6 space-y-6">
        {/* Combat Stats */}
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            <Target className="h-3.5 w-3.5 text-red-400" />
            Combat
          </h3>
          <div className="space-y-3">
            <StatBar
              label="Kills"
              team100Value={team100Stats.kills}
              team200Value={team200Stats.kills}
            />
            <StatBar
              label="Deaths"
              team100Value={team100Stats.deaths}
              team200Value={team200Stats.deaths}
            />
            <StatBar
              label="Damage Dealt"
              team100Value={team100Stats.damage}
              team200Value={team200Stats.damage}
              format={(v) => `${Math.round(v / 1000)}k`}
            />
            <StatBar
              label="Damage Taken"
              team100Value={team100Stats.damageTaken}
              team200Value={team200Stats.damageTaken}
              format={(v) => `${Math.round(v / 1000)}k`}
            />
          </div>
        </div>

        {/* Economy Stats */}
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            <Crown className="h-3.5 w-3.5 text-yellow-400" />
            Economy
          </h3>
          <div className="space-y-3">
            <StatBar
              label="Gold Earned"
              team100Value={team100Stats.gold}
              team200Value={team200Stats.gold}
              format={(v) => `${(v / 1000).toFixed(1)}k`}
            />
            <StatBar
              label="CS"
              team100Value={team100Stats.cs}
              team200Value={team200Stats.cs}
            />
          </div>
        </div>

        {/* Vision & Map Control */}
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            <Eye className="h-3.5 w-3.5 text-purple-400" />
            Vision & Map Control
          </h3>
          <div className="space-y-3">
            <StatBar
              label="Vision Score"
              team100Value={team100Stats.vision}
              team200Value={team200Stats.vision}
            />
            <StatBar
              label="Towers"
              team100Value={team100Stats.towers}
              team200Value={team200Stats.towers}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
