import { Coins, Crosshair, Target } from "lucide-react";

interface MatchStatsProps {
  cs: number;
  gold: number;
  damage: number;
  size?: "sm" | "md";
}

export default function MatchStats({
  cs,
  gold,
  damage,
  size = "md",
}: MatchStatsProps) {
  const textSize = size === "sm" ? "text-[10px]" : "text-xs";
  const iconSize = size === "sm" ? 10 : 12;

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        <Target className="text-zinc-500" size={iconSize} />
        <span className={`${textSize} font-medium text-zinc-400`}>
          {cs}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <Coins className="text-zinc-500" size={iconSize} />
        <span className={`${textSize} font-medium text-zinc-400`}>
          {formatNumber(gold)}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <Crosshair className="text-zinc-500" size={iconSize} />
        <span className={`${textSize} font-medium text-zinc-400`}>
          {formatNumber(damage)}
        </span>
      </div>
    </div>
  );
}
