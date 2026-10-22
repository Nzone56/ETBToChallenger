import { cn } from "@/app/lib/utils";

interface PageHeaderProps {
  title: React.ReactNode;
  /** Small label above the title */
  eyebrow?: React.ReactNode;
  description?: React.ReactNode;
  /** Right-aligned controls */
  actions?: React.ReactNode;
  className?: string;
}

/** The heading every page opens with. */
export default function PageHeader({
  title,
  eyebrow,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn("flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-primary">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}
