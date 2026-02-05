import { BestOfChallenge } from "@/app/types/riot";
import { formatKda, formatWinrate } from "@/app/lib/helpers";
import {
  Crown,
  Crosshair,
  Zap,
  Swords,
  Skull,
  Heart,
  Shield,
  Target,
} from "lucide-react";
import { MIN_CHAMPION_GAMES } from "@/app/data/constants";

interface BestOfSectionProps {
  best: BestOfChallenge;
}

export default function BestOfSection({ best }: BestOfSectionProps) {
  const cards = [
    {
      label: "Top Winrate",
      icon: <Crown className="h-5 w-5 text-yellow-400" />,
      player: best.topWinrate?.gameName ?? "—",
      value: best.topWinrate ? formatWinrate(best.topWinrate.value) : "—",
      sublabel: best.topWinrate
        ? `across ${best.topWinrate.games} flex games`
        : undefined,
      gradient: "from-yellow-600/20 to-transparent",
      border: "border-yellow-700/30",
    },
    {
      label: "Top KDA",
      icon: <Crosshair className="h-5 w-5 text-emerald-400" />,
      player: best.topKda?.gameName ?? "—",
      value: best.topKda ? `${formatKda(best.topKda.value)} KDA` : "—",
      sublabel: best.topKda
        ? `across ${best.topKda.games} flex games`
        : undefined,
      gradient: "from-emerald-600/20 to-transparent",
      border: "border-emerald-700/30",
    },
    {
      label: "Top Damage",
      icon: <Zap className="h-5 w-5 text-red-400" />,
      player: best.topDamage?.gameName ?? "—",
      value: best.topDamage
        ? `${Math.round(best.topDamage.value).toLocaleString()}`
        : "—",
      sublabel: best.topDamage
        ? `avg DMG across ${best.topDamage.games} flex games`
        : undefined,
      gradient: "from-red-600/20 to-transparent",
      border: "border-red-700/30",
    },
    {
      label: `Best Champion (${MIN_CHAMPION_GAMES}+ games)`,
      icon: <Swords className="h-5 w-5 text-purple-400" />,
      player: best.bestChampion?.gameName ?? "—",
      value: best.bestChampion?.championName ?? "—",
      sublabel: best.bestChampion
        ? `${formatWinrate(best.bestChampion.winrate)} in ${best.bestChampion.games} games`
        : undefined,
      gradient: "from-purple-600/20 to-transparent",
      border: "border-purple-700/30",
    },
    {
      label: "Most Avg Kills",
      icon: <Skull className="h-5 w-5 text-orange-400" />,
      player: best.mostAvgKills?.gameName ?? "—",
      value: best.mostAvgKills
        ? `${best.mostAvgKills.value.toFixed(1)} kills/game`
        : "—",
      sublabel: best.mostAvgKills
        ? `across ${best.mostAvgKills.games} flex games`
        : undefined,
      gradient: "from-orange-600/20 to-transparent",
      border: "border-orange-700/30",
    },
    {
      label: "Least Avg Deaths",
      icon: <Shield className="h-5 w-5 text-sky-400" />,
      player: best.leastAvgDeaths?.gameName ?? "—",
      value: best.leastAvgDeaths
        ? `${best.leastAvgDeaths.value.toFixed(1)} deaths/game`
        : "—",
      sublabel: best.leastAvgDeaths
        ? `across ${best.leastAvgDeaths.games} flex games`
        : undefined,
      gradient: "from-sky-600/20 to-transparent",
      border: "border-sky-700/30",
    },
    {
      label: "Most Avg Assists",
      icon: <Heart className="h-5 w-5 text-pink-400" />,
      player: best.mostAvgAssists?.gameName ?? "—",
      value: best.mostAvgAssists
        ? `${best.mostAvgAssists.value.toFixed(1)} assists/game`
        : "—",
      sublabel: best.mostAvgAssists
        ? `across ${best.mostAvgAssists.games} flex games`
        : undefined,
      gradient: "from-pink-600/20 to-transparent",
      border: "border-pink-700/30",
    },
    {
      label: "Top Kill Participation",
      icon: <Target className="h-5 w-5 text-cyan-400" />,
      player: best.topKillParticipation?.gameName ?? "—",
      value: best.topKillParticipation
        ? `${best.topKillParticipation.value.toFixed(1)}% KP`
        : "—",
      sublabel: best.topKillParticipation
        ? `across ${best.topKillParticipation.games} flex games`
        : undefined,
      gradient: "from-cyan-600/20 to-transparent",
      border: "border-cyan-700/30",
    },
  ];

  return (
    <div>
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-400">
        Best of the Challenge
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 stagger-grid">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`rounded-xl border ${card.border} bg-linear-to-br ${card.gradient} bg-zinc-900/60 p-4 backdrop-blur-sm`}
          >
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-zinc-400">
              {card.icon}
              {card.label}
            </div>
            <div className="mt-2 text-lg font-bold text-zinc-100">
              {card.value}
            </div>
            <div className="mt-0.5 text-sm text-zinc-300">{card.player}</div>
            {card.sublabel && (
              <div className="mt-0.5 text-xs text-zinc-500">
                {card.sublabel}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
