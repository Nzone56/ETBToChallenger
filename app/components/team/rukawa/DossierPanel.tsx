import type { LucideIcon } from "lucide-react";
import { cn } from "@/app/lib/utils";

interface DossierPanelProps {
  title: string;
  icon?: LucideIcon;
  description?: string;
  className?: string;
  children: React.ReactNode;
}

/** A Panel dressed as a page of the classified file. */
export default function DossierPanel({ title, icon: Icon, description, className, children }: DossierPanelProps) {
  return (
    <section className={cn("overflow-hidden rounded-xl border border-dossier/25 bg-card", className)}>
      <header className="flex items-center gap-2.5 border-b border-dossier/20 bg-dossier/5 px-5 py-3.5">
        {Icon && <Icon className="size-4 text-dossier" />}
        <div>
          <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.15em] text-dossier">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}
