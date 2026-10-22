"use client";

import { ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/app/lib/utils";

interface MoreButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  /** Rotates the chevron: the content it controls is open */
  expanded?: boolean;
  loading?: boolean;
  /** footer: full-width bar at the bottom of a Panel. inline: small text button. */
  variant?: "footer" | "inline" | "block";
  className?: string;
}

/** "Show more", "Load more", "Show less" — one button for all of them. */
export default function MoreButton({
  onClick,
  children,
  expanded,
  loading = false,
  variant = "footer",
  className,
}: MoreButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      aria-expanded={expanded}
      className={cn(
        "flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-60",
        variant === "footer" && "w-full border-t border-border py-2.5 hover:bg-muted",
        variant === "block" &&
          "w-full rounded-lg border border-border bg-card py-2.5 hover:bg-muted",
        className,
      )}
    >
      {loading ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <ChevronDown
          className={cn("size-3.5 transition-transform", expanded && "rotate-180")}
        />
      )}
      {children}
    </button>
  );
}
