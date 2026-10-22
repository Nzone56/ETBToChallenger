import Link from "next/link";

/** Wordmark: the ETB crest and "to Challenger". */
export default function Brand() {
  return (
    <Link href="/" className="group flex items-center gap-2.5" aria-label="ETB to Challenger — dashboard">
      <span className="relative flex size-8 items-center justify-center">
        <span className="absolute inset-0 rotate-45 rounded-md border border-primary/50 bg-primary/10 transition-colors group-hover:bg-primary/20" />
        <span className="relative font-display text-[11px] font-bold tracking-tight text-primary">
          ETB
        </span>
      </span>
      <span className="leading-tight">
        <span className="block font-display text-sm font-semibold uppercase tracking-wider text-foreground">
          ETB
        </span>
        <span className="block text-[11px] text-muted-foreground">to Challenger</span>
      </span>
    </Link>
  );
}
