"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { tabClass, tabListClass, type TabVariant } from "./tabStyles";

export interface SegmentOption<T extends string> {
  value: T;
  label: React.ReactNode;
  icon?: LucideIcon;
  disabled?: boolean;
  /** Small trailing count or marker */
  meta?: React.ReactNode;
}

interface SegmentedControlProps<T extends string> {
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** pill: filled track (filters). underline: tabs. */
  variant?: TabVariant;
  size?: "sm" | "md";
  /** Stretch segments to fill the row */
  fullWidth?: boolean;
  /** Wrap onto more lines instead of scrolling — for long option lists */
  wrap?: boolean;
  ariaLabel: string;
  className?: string;
}

/**
 * In-page filters and tabs held in client state. Page-level tabs that should
 * survive a reload or a shared link use LinkTabs instead — same look.
 */
export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  variant = "pill",
  size = "sm",
  fullWidth = false,
  wrap = false,
  ariaLabel,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div role="tablist" aria-label={ariaLabel} className={tabListClass(variant, cn(fullWidth && "w-full", className), wrap)}>
      {options.map((option) => {
        const active = option.value === value;
        const Icon = option.icon;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={option.disabled}
            onClick={() => onChange(option.value)}
            className={cn(tabClass(variant, active, size), fullWidth && "flex-1")}
          >
            {Icon && <Icon className={cn("size-3.5", active && variant === "underline" && "text-primary")} />}
            {option.label}
            {option.meta}
          </button>
        );
      })}
    </div>
  );
}
