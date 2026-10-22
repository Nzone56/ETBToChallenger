import type { PlayerRoleNominee, SignaturePickNominee } from "@/app/lib/awards";
import { roleLabel } from "@/app/components/ui/RoleIcon";
import { formatKda, formatNumber, formatWinrate } from "@/app/lib/format";

export type AwardRoleKey = "overall" | "TOP" | "JUNGLE" | "MIDDLE" | "BOTTOM" | "UTILITY";

export const AWARD_ROLE_KEYS: AwardRoleKey[] = ["overall", "TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"];

export interface NomineeStat {
  label: string;
  value: string;
  tone?: "win" | "loss" | "cir";
}

/**
 * One nominee, shaped for display. Both award families (player-in-role and
 * signature pick) map to this so one card and one row render either.
 */
export interface NomineeView {
  key: string;
  title: string;
  subtitle: string;
  art: { kind: "avatar"; iconId: number | null } | { kind: "champion"; name: string };
  score: number;
  avgCir: number;
  stats: NomineeStat[];
}

const winrateStat = (wr: number): NomineeStat => ({
  label: "Win rate",
  value: formatWinrate(wr),
  tone: wr >= 50 ? "win" : "loss",
});

export function roleNomineeView(n: PlayerRoleNominee, iconId: number | null): NomineeView {
  const support = n.role === "UTILITY";
  return {
    key: `${n.puuid}-${n.role}`,
    title: n.gameName,
    subtitle: `${roleLabel(n.role)} · ${n.totalGames} games`,
    art: { kind: "avatar", iconId },
    score: n.performanceScore,
    avgCir: n.avgCir,
    stats: [
      winrateStat(n.winrate),
      { label: "KDA", value: formatKda(n.kda) },
      support
        ? { label: "Games", value: String(n.totalGames) }
        : { label: "DMG / min", value: formatNumber(n.avgDmgPerMin) },
    ],
  };
}

export function pickNomineeView(n: SignaturePickNominee): NomineeView {
  const support = n.role === "UTILITY";
  return {
    key: `${n.puuid}-${n.championId}-${n.role}`,
    title: n.championName,
    subtitle: `${n.gameName} · ${roleLabel(n.role)} · ${n.totalGames} games`,
    art: { kind: "champion", name: n.championName },
    score: n.performanceScore,
    avgCir: n.avgCir,
    stats: [
      winrateStat(n.winrate),
      support
        ? { label: "Vision", value: n.keyStatValue.toFixed(1) }
        : { label: "DMG / min", value: formatNumber(n.keyStatValue) },
    ],
  };
}
