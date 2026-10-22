import { cn } from "@/app/lib/utils";

export type TabVariant = "pill" | "underline";

/** Container classes for a row of tabs. Shared by SegmentedControl and LinkTabs. */
export function tabListClass(variant: TabVariant, className?: string, wrap = false) {
  return cn(
    "flex items-center",
    wrap ? "flex-wrap" : "no-scrollbar overflow-x-auto",
    variant === "pill" ? "gap-1 rounded-lg bg-background/60 p-1" : "gap-6 border-b border-border",
    className,
  );
}

/** Classes for one tab. */
export function tabClass(variant: TabVariant, active: boolean, size: "sm" | "md" = "sm") {
  return cn(
    "inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap font-medium transition-colors disabled:opacity-35",
    variant === "pill" && [
      "rounded-md",
      size === "sm" ? "px-2.5 py-1 text-xs" : "px-3.5 py-1.5 text-sm",
      active
        ? "bg-raised text-foreground shadow-sm ring-1 ring-border-strong"
        : "text-muted-foreground hover:bg-muted hover:text-foreground",
    ],
    variant === "underline" && [
      "-mb-px border-b-2 pb-3 pt-1 text-sm",
      active
        ? "border-primary text-foreground"
        : "border-transparent text-muted-foreground hover:text-foreground",
    ],
  );
}
