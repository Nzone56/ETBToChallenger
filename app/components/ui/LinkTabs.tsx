import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { tabClass, tabListClass, type TabVariant } from "./tabStyles";

export interface LinkTab {
  value: string;
  label: React.ReactNode;
  href: string;
  icon?: LucideIcon;
  /** Shown but not navigable, e.g. a phase that hasn't opened */
  locked?: boolean;
}

interface LinkTabsProps {
  tabs: LinkTab[];
  active: string;
  variant?: TabVariant;
  ariaLabel: string;
  className?: string;
}

/**
 * Page-level tabs whose state lives in the URL (`?tab=…`), so a view can be
 * linked and survives a reload. Server component — no client JS.
 */
export default function LinkTabs({ tabs, active, variant = "underline", ariaLabel, className }: LinkTabsProps) {
  return (
    <nav aria-label={ariaLabel} className={tabListClass(variant, className)}>
      {tabs.map(({ value, label, href, icon: Icon, locked }) => {
        const isActive = value === active;
        const content = (
          <>
            {Icon && <Icon className={cn("size-4", isActive && "text-primary")} />}
            {label}
          </>
        );
        return locked ? (
          <span key={value} aria-disabled="true" className={cn(tabClass(variant, false), "opacity-40")}>
            {content}
          </span>
        ) : (
          <Link
            key={value}
            href={href}
            scroll={false}
            aria-current={isActive ? "page" : undefined}
            className={tabClass(variant, isActive)}
          >
            {content}
          </Link>
        );
      })}
    </nav>
  );
}
