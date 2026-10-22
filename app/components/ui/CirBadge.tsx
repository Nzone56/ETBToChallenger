import { getCirTier } from "@/app/lib/cirUtils";
import { cn } from "@/app/lib/utils";

interface CirBadgeProps {
  score: number;
  /** letter: compact "S"; label: full word "Solid" */
  detail?: "letter" | "label";
  size?: "sm" | "md";
  className?: string;
}

/** A CIR score with its tier, in the tier's colour. */
export default function CirBadge({
  score,
  detail = "letter",
  size = "sm",
  className,
}: CirBadgeProps) {
  const tier = getCirTier(score);
  return (
    <div
      className={cn(
        "inline-flex shrink-0 flex-col items-center justify-center rounded-lg border leading-none",
        size === "sm" ? "min-w-12 px-2 py-1.5" : "min-w-16 px-3 py-2",
        tier.soft,
        className,
      )}
      title={`CIR ${score.toFixed(1)} · ${tier.label}`}
    >
      <span
        className={cn(
          "num font-display font-semibold",
          size === "sm" ? "text-sm" : "text-lg",
          tier.text,
        )}
      >
        {score.toFixed(1)}
      </span>
      <span className={cn("mt-1 text-[9px] font-medium uppercase tracking-wider", tier.text)}>
        {detail === "letter" ? `CIR · ${tier.letter}` : tier.label}
      </span>
    </div>
  );
}
