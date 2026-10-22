import Skeleton from "@/app/components/ui/Skeleton";

/**
 * Route-level loading state. Next prefetches `loading.tsx`, so a click paints
 * this instantly instead of freezing on the previous page while data loads.
 */
export default function PageSkeleton({
  variant = "default",
}: {
  /** default: page header + body. hero: banner + body. content: body only (inside a page). */
  variant?: "default" | "hero" | "content";
}) {
  return (
    <div className="space-y-8" aria-busy aria-label="Loading">
      {variant === "hero" ? (
        <Skeleton className="h-56 w-full rounded-xl" />
      ) : variant === "content" ? null : (
        <div className="space-y-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-9 w-72" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-96 rounded-xl lg:col-span-2" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    </div>
  );
}
