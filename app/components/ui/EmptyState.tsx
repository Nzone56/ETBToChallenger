import type { LucideIcon } from "lucide-react";
import { cn } from "@/app/lib/utils";

interface EmptyStateProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: LucideIcon;
  action?: React.ReactNode;
  /** compact: inline inside a Panel. full: page-level message. */
  size?: "compact" | "full";
  className?: string;
}

export default function EmptyState({
  title,
  description,
  icon: Icon,
  action,
  size = "compact",
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        size === "compact" ? "gap-1.5 px-6 py-10" : "min-h-[50vh] gap-3 px-6",
        className,
      )}
    >
      {Icon && (
        <div className="mb-1 flex size-10 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground">
          <Icon className="size-5" />
        </div>
      )}
      <p
        className={cn(
          "font-medium text-foreground",
          size === "full" ? "font-display text-xl" : "text-sm",
        )}
      >
        {title}
      </p>
      {description && (
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
