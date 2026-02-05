import { Loader2 } from "lucide-react";
import { cn } from "@/app/lib/utils";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
}

const sizes = { sm: "h-4 w-4", md: "h-6 w-6", lg: "h-10 w-10" };

export default function Spinner({ size = "md", className, label }: SpinnerProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <Loader2 className={cn("animate-spin text-zinc-400", sizes[size])} />
      {label && <span className="text-xs text-zinc-500">{label}</span>}
    </div>
  );
}
