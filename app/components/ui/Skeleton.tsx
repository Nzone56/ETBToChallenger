import { cn } from "@/app/lib/utils";

/** Placeholder block. Skeletons mirror the real layout's boxes 1:1. */
export default function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("animate-pulse rounded-md bg-muted", className)}
    />
  );
}
