import type { LucideIcon } from "lucide-react";
import { cn } from "@/app/lib/utils";

/**
 * The app's one surface. Every card-like container is a Panel, so radius,
 * border and fill are decided here and nowhere else.
 */
export function Panel({
  as: Tag = "section",
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLElement> & {
  as?: "section" | "div" | "article";
}) {
  return (
    <Tag
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-card",
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}

interface PanelHeaderProps {
  title: React.ReactNode;
  icon?: LucideIcon;
  /** Tailwind text colour for the icon */
  iconClassName?: string;
  description?: React.ReactNode;
  /** Right-aligned content: counts, toggles, links */
  actions?: React.ReactNode;
  className?: string;
}

export function PanelHeader({
  title,
  icon: Icon,
  iconClassName = "text-primary",
  description,
  actions,
  className,
}: PanelHeaderProps) {
  return (
    <header
      className={cn(
        "flex items-center gap-3 border-b border-border px-5 py-3.5",
        className,
      )}
    >
      {Icon && <Icon className={cn("size-4 shrink-0", iconClassName)} />}
      <div className="min-w-0 flex-1">
        <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-foreground">
          {title}
        </h2>
        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}
