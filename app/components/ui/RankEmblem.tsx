import { TIER_COLORS } from "@/app/data/constants";
import { RankTier } from "@/app/types/riot";

interface RankEmblemProps {
  tier: RankTier;
  size?: number;
  className?: string;
}

export default function RankEmblem({ tier, size = 24, className }: RankEmblemProps) {
  const color = TIER_COLORS[tier];
  const label = tier.charAt(0) + tier.slice(1).toLowerCase();

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label={`${label} rank emblem`}
    >
      {/* Shield shape */}
      <path
        d="M20 2L4 10V22C4 30.5 11 37 20 39C29 37 36 30.5 36 22V10L20 2Z"
        fill={`${color}33`}
        stroke={color}
        strokeWidth="2"
      />
      {/* Inner diamond */}
      <path
        d="M20 10L28 20L20 30L12 20L20 10Z"
        fill={`${color}66`}
        stroke={color}
        strokeWidth="1.5"
      />
      {/* Center dot */}
      <circle cx="20" cy="20" r="3" fill={color} />
      {/* Tier initial */}
      <text
        x="20"
        y="21.5"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="white"
        fontSize="5"
        fontWeight="bold"
        fontFamily="system-ui, sans-serif"
      >
        {tier.slice(0, 1)}
      </text>
    </svg>
  );
}
