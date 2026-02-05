import { cn } from "@/app/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  icon?: React.ReactNode;
  accent?: "default" | "win" | "loss" | "gold";
  className?: string;
}

export default function StatCard({
  label,
  value,
  sublabel,
  icon,
  accent = "default",
  className,
}: StatCardProps) {
  const accentStyles = {
    default: "border-zinc-700/50 bg-zinc-900/60",
    win: "border-emerald-700/50 bg-emerald-950/30",
    loss: "border-red-700/50 bg-red-950/30",
    gold: "border-yellow-600/50 bg-yellow-950/20",
  };

  return (
    <div
      className={cn(
        "rounded-xl border p-4 backdrop-blur-sm",
        accentStyles[accent],
        className,
      )}
    >
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-zinc-400">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold text-zinc-100">{value}</div>
      {sublabel && (
        <div className="mt-0.5 text-xs text-zinc-500">{sublabel}</div>
      )}
    </div>
  );
}
