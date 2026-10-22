import { cn } from "@/app/lib/utils";

interface KdaDisplayProps {
  kills: number;
  deaths: number;
  assists: number;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const SIZES = { sm: "text-xs", md: "text-sm", lg: "text-base" };

/** K / D / A with deaths in loss red. */
export default function KdaDisplay({
  kills,
  deaths,
  assists,
  className,
  size = "md",
}: KdaDisplayProps) {
  return (
    <span className={cn("num whitespace-nowrap font-medium", SIZES[size], className)}>
      <span className="text-foreground">{kills}</span>
      <span className="text-faint"> / </span>
      <span className="text-loss">{deaths}</span>
      <span className="text-faint"> / </span>
      <span className="text-foreground">{assists}</span>
    </span>
  );
}
