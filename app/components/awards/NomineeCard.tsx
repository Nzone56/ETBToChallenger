import { Crown } from "lucide-react";
import { getChampionSplashUrl } from "@/app/data/constants";
import { getCirColor } from "@/app/lib/cirUtils";
import { cn } from "@/app/lib/utils";
import NomineeArt from "./NomineeArt";
import type { NomineeStat, NomineeView } from "./nomineeViews";

const PLACE = [
  { label: "1st", ring: "border-medal-gold/60", text: "text-medal-gold" },
  { label: "2nd", ring: "border-medal-silver/40", text: "text-medal-silver" },
  { label: "3rd", ring: "border-medal-bronze/40", text: "text-medal-bronze" },
];

function statTone(stat: NomineeStat, cir: number) {
  if (stat.tone === "win") return "text-win";
  if (stat.tone === "loss") return "text-loss";
  if (stat.tone === "cir") return getCirColor(cir);
  return "text-foreground";
}

/** A podium nominee. First place is taller and wears gold. */
export default function NomineeCard({ nominee, place, version }: { nominee: NomineeView; place: 0 | 1 | 2; version: string }) {
  const p = PLACE[place];
  const first = place === 0;

  return (
    <article
      className={cn(
        "relative flex flex-col overflow-hidden rounded-xl border bg-card",
        p.ring,
        first && "md:-translate-y-3 shadow-[0_0_40px_-12px_rgb(242_201_76/0.45)]",
      )}
    >
      {nominee.art.kind === "champion" && (
        <img
          src={getChampionSplashUrl(nominee.art.name)}
          alt=""
          className="absolute inset-0 h-40 w-full object-cover object-top opacity-35"
          loading="lazy"
        />
      )}
      <div className="relative h-40 bg-linear-to-b from-transparent to-card" />
      <div className="relative -mt-28 flex flex-col items-center px-5 pb-5 text-center">
        <span className={cn("mb-2 flex items-center gap-1 font-display text-sm font-semibold uppercase tracking-wider", p.text)}>
          {first && <Crown className="size-4" />}
          {p.label}
        </span>
        <div className={cn("rounded-full border-2 p-1", p.ring)}>
          <NomineeArt art={nominee.art} version={version} size={first ? 80 : 64} />
        </div>
        <h3 className="mt-3 w-full truncate font-display text-xl font-semibold">{nominee.title}</h3>
        <p className="w-full truncate text-xs text-muted-foreground">{nominee.subtitle}</p>

        <div className="mt-4 flex items-baseline gap-1.5">
          <span className="num font-display text-4xl font-semibold leading-none">{nominee.score.toFixed(1)}</span>
          <span className="text-xs uppercase tracking-wider text-faint">score</span>
        </div>

        <dl className="mt-4 grid w-full grid-cols-3 gap-2 border-t border-border pt-4">
          <div>
            <dt className="text-[10px] uppercase tracking-wider text-faint">Avg CIR</dt>
            <dd className={cn("num text-sm font-semibold", getCirColor(nominee.avgCir))}>{nominee.avgCir.toFixed(1)}</dd>
          </div>
          {nominee.stats.slice(0, 2).map((s) => (
            <div key={s.label}>
              <dt className="text-[10px] uppercase tracking-wider text-faint">{s.label}</dt>
              <dd className={cn("num text-sm font-semibold", statTone(s, nominee.avgCir))}>{s.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </article>
  );
}
