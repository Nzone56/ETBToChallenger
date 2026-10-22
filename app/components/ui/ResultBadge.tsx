import type { MatchResult } from "@/app/lib/format";
import Badge from "./Badge";

const LABELS: Record<MatchResult, string> = {
  win: "Win",
  loss: "Loss",
  remake: "Remake",
};

/** Accent stripe colour for rows/cards that carry a result. */
export const RESULT_STRIPE: Record<MatchResult, string> = {
  win: "bg-win",
  loss: "bg-loss",
  remake: "bg-remake",
};

/** Text colour for a result word or figure. */
export const RESULT_TEXT: Record<MatchResult, string> = {
  win: "text-win",
  loss: "text-loss",
  remake: "text-remake",
};

export default function ResultBadge({
  result,
  className,
}: {
  result: MatchResult;
  className?: string;
}) {
  return (
    <Badge tone={result} size="xs" className={className}>
      {LABELS[result]}
    </Badge>
  );
}
