import { cn } from "@/app/lib/utils";

const MEDALS = ["text-medal-gold", "text-medal-silver", "text-medal-bronze"];

interface RankNumberProps {
  /** 1-based position */
  position: number;
  /** "worst" paints the top three in loss red instead of medals */
  variant?: "best" | "worst";
  className?: string;
}

/** A leaderboard position. Gold/silver/bronze for the podium, quiet after. */
export default function RankNumber({
  position,
  variant = "best",
  className,
}: RankNumberProps) {
  const podium = position <= 3;
  return (
    <span
      className={cn(
        "num w-6 shrink-0 text-center font-display text-sm font-semibold",
        podium
          ? variant === "best"
            ? MEDALS[position - 1]
            : "text-loss"
          : "text-faint",
        className,
      )}
    >
      {position}
    </span>
  );
}
