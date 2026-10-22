import Link from "next/link";
import { Compass } from "lucide-react";
import EmptyState from "./components/ui/EmptyState";

export default function NotFound() {
  return (
    <EmptyState
      size="full"
      icon={Compass}
      title="Lost in the jungle"
      description="That page, player or match isn't tracked here."
      action={
        <Link
          href="/"
          className="inline-flex items-center rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted"
        >
          Back to the dashboard
        </Link>
      }
    />
  );
}
