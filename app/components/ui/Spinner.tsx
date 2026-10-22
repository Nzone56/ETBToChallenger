import { Loader2 } from "lucide-react";
import { cn } from "@/app/lib/utils";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
}

const sizes = { sm: "size-4", md: "size-6", lg: "size-10" };

export default function Spinner({ size = "md", className, label }: SpinnerProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <Loader2 className={cn("animate-spin text-primary", sizes[size])} />
      {label && <span className="text-xs text-muted-foreground">{label}</span>}
    </div>
  );
}
