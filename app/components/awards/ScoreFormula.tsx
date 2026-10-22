import { Sigma } from "lucide-react";
import { Panel, PanelHeader } from "@/app/components/ui/Panel";
import {
  AWARD_CIR_WEIGHT,
  AWARD_PRIOR_GAMES,
  PICK_AWARD_MIN_GAMES,
  ROLE_AWARD_MIN_GAMES,
} from "@/app/lib/awards";

/** How nominees are scored and who qualifies. */
export default function ScoreFormula() {
  const cirW = AWARD_CIR_WEIGHT;
  const wrW = Number((1 - AWARD_CIR_WEIGHT).toFixed(2));

  return (
    <Panel>
      <PanelHeader icon={Sigma} title="How the score works" />
      <div className="grid gap-5 p-5 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-2">
          <p className="font-mono text-sm text-primary">
            score = avg CIR × {cirW} + win rate × {wrW}
          </p>
          <p className="text-sm text-muted-foreground">
            Both averages are first blended with the roster&apos;s season average, as if you&apos;d played{" "}
            {AWARD_PRIOR_GAMES.role} extra average games ({AWARD_PRIOR_GAMES.pick} for signature picks). More
            games, more trust: a lucky 5–0 has to be very good to beat a strong 30-game run. Remakes don&apos;t
            count.
          </p>
        </div>
        <div className="rounded-lg border border-border bg-raised/60 p-3">
          <p className="text-sm font-semibold">Player awards</p>
          <p className="text-xs text-muted-foreground">
            Min. {ROLE_AWARD_MIN_GAMES} games in the role · one nomination per role, so up to five for MVP
          </p>
        </div>
        <div className="rounded-lg border border-border bg-raised/60 p-3">
          <p className="text-sm font-semibold">Signature picks</p>
          <p className="text-xs text-muted-foreground">
            Min. {PICK_AWARD_MIN_GAMES} games on the champion in one role · Diana mid and Diana jungle are separate picks
          </p>
        </div>
      </div>
    </Panel>
  );
}
