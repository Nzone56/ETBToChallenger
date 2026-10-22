import { TIER_COLORS } from "@/app/data/constants";
import { RankTier } from "@/app/types/riot";
import { formatTier } from "@/app/lib/format";

interface RankEmblemProps {
  tier: RankTier;
  size?: number;
  className?: string;
}

/** A faceted crest in the tier's colour. Decorative next to a tier label. */
export default function RankEmblem({ tier, size = 24, className }: RankEmblemProps) {
  const color = TIER_COLORS[tier];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      className={className}
      role="img"
      aria-label={`${formatTier(tier)} emblem`}
    >
      <path
        d="M20 2 35 11v18L20 38 5 29V11L20 2Z"
        fill={`${color}26`}
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M20 9 29 20 20 31 11 20 20 9Z" fill={`${color}80`} />
      <path d="M20 9 29 20H11L20 9Z" fill={color} opacity="0.9" />
    </svg>
  );
}
