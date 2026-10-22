import { cn } from "@/app/lib/utils";

interface MeterProps {
  /** 0–100 */
  value: number;
  /** Fill colour class, e.g. "bg-primary" */
  fillClassName?: string;
  size?: "xs" | "sm";
  label?: string;
  className?: string;
}

/** A single horizontal bar: share of games, a split, a score. */
export default function Meter({
  value,
  fillClassName = "bg-primary",
  size = "sm",
  label,
  className,
}: MeterProps) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-full bg-muted",
        size === "xs" ? "h-1" : "h-1.5",
        className,
      )}
      role="meter"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div className={cn("grow-x h-full rounded-full", fillClassName)} style={{ width: `${pct}%` }} />
    </div>
  );
}
