import type { LucideIcon } from "lucide-react";
import { cn } from "@/app/lib/utils";

interface StatTileProps {
  label: React.ReactNode;
  value: React.ReactNode;
  sub?: React.ReactNode;
  icon?: LucideIcon;
  /** Text colour class for the value */
  valueClassName?: string;
  size?: "sm" | "md" | "lg";
  /** card: its own bordered surface. plain: sits inside a Panel. */
  variant?: "card" | "plain";
  className?: string;
}

const VALUE_SIZE = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-4xl",
};

/** A labelled figure. Used for KPI strips, hero stats and summaries. */
export default function StatTile({
  label,
  value,
  sub,
  icon: Icon,
  valueClassName = "text-foreground",
  size = "md",
  variant = "card",
  className,
}: StatTileProps) {
  return (
    <div
      className={cn(
        variant === "card" && "rounded-xl border border-border bg-card px-4 py-3.5",
        className,
      )}
    >
      <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {Icon && <Icon className="size-3.5" />}
        {label}
      </div>
      <div
        className={cn(
          "num mt-1 font-display font-semibold leading-none",
          VALUE_SIZE[size],
          valueClassName,
        )}
      >
        {value}
      </div>
      {sub && <div className="mt-1.5 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}
