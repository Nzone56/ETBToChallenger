import type { LucideIcon } from "lucide-react";
import { cn } from "@/app/lib/utils";

interface SectionHeaderProps {
  title: React.ReactNode;
  icon?: LucideIcon;
  iconClassName?: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  as?: "h2" | "h3";
  className?: string;
}

/** Heading for a block of content that is not itself inside a Panel. */
export default function SectionHeader({
  title,
  icon: Icon,
  iconClassName = "text-primary",
  description,
  actions,
  as: Heading = "h2",
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("mb-4 flex flex-wrap items-end gap-3", className)}>
      <div className="min-w-0 flex-1">
        <Heading className="flex items-center gap-2 font-display text-base font-semibold uppercase tracking-wider text-foreground">
          {Icon && <Icon className={cn("size-4 shrink-0", iconClassName)} />}
          {title}
        </Heading>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
