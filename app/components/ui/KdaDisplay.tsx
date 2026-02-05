import { cn } from "@/app/lib/utils";

interface KdaDisplayProps {
  kills: number;
  deaths: number;
  assists: number;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function KdaDisplay({
  kills,
  deaths,
  assists,
  className,
  size = "md",
}: KdaDisplayProps) {
  const sizeStyles = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <span className={cn("font-medium", sizeStyles[size], className)}>
      <span className="text-zinc-100">{kills}</span>
      <span className="text-zinc-500"> / </span>
      <span className="text-red-400">{deaths}</span>
      <span className="text-zinc-500"> / </span>
      <span className="text-zinc-100">{assists}</span>
    </span>
  );
}
