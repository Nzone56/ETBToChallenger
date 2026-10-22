import { cn } from "@/app/lib/utils";

export type BadgeTone =
  | "neutral"
  | "primary"
  | "accent"
  | "win"
  | "loss"
  | "remake";

const TONES: Record<BadgeTone, string> = {
  neutral: "border-border-strong bg-muted text-muted-foreground",
  primary: "border-primary/30 bg-primary/10 text-primary",
  accent: "border-accent/30 bg-accent/10 text-accent",
  win: "border-win/30 bg-win/10 text-win",
  loss: "border-loss/30 bg-loss/10 text-loss",
  remake: "border-remake/30 bg-remake/10 text-remake",
};

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  size?: "xs" | "sm";
}

/** Small label pill: roles, results, counts, tags. */
export default function Badge({
  tone = "neutral",
  size = "sm",
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-md border font-medium",
        size === "xs"
          ? "px-1.5 py-px text-[10px] uppercase tracking-wide"
          : "px-2 py-0.5 text-xs",
        TONES[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
