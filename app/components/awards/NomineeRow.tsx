import RankNumber from "@/app/components/ui/RankNumber";
import { getCirColor } from "@/app/lib/cirUtils";
import { cn } from "@/app/lib/utils";
import NomineeArt from "./NomineeArt";
import type { NomineeView } from "./nomineeViews";

/** A nominee below the podium. */
export default function NomineeRow({ nominee, place, version }: { nominee: NomineeView; place: number; version: string }) {
  return (
    <li className="flex items-center gap-3 px-5 py-2.5">
      <RankNumber position={place} />
      <NomineeArt art={nominee.art} version={version} size={30} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{nominee.title}</p>
        <p className="truncate text-xs text-faint">{nominee.subtitle}</p>
      </div>
      {nominee.stats.map((s) => (
        <div key={s.label} className="hidden w-20 text-right md:block">
          <p className={cn("num text-sm", s.tone === "win" ? "text-win" : s.tone === "loss" ? "text-loss" : "text-foreground")}>
            {s.value}
          </p>
          <p className="text-[10px] uppercase tracking-wider text-faint">{s.label}</p>
        </div>
      ))}
      <div className="w-16 text-right">
        <p className={cn("num text-sm font-semibold", getCirColor(nominee.avgCir))}>{nominee.avgCir.toFixed(1)}</p>
        <p className="text-[10px] uppercase tracking-wider text-faint">CIR</p>
      </div>
      <div className="w-16 text-right">
        <p className="num font-display text-base font-semibold">{nominee.score.toFixed(1)}</p>
        <p className="text-[10px] uppercase tracking-wider text-faint">Score</p>
      </div>
    </li>
  );
}
