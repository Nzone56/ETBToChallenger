import type { AwardsData } from "@/app/lib/awards";
import {
  AWARD_ROLE_KEYS,
  pickNomineeView,
  roleNomineeView,
  type AwardRoleKey,
  type NomineeView,
} from "./nomineeViews";

export type AwardCategories = Record<AwardRoleKey, NomineeView[]>;

/**
 * Player-in-role categories. The MVP list holds every role nomination, so one
 * player can appear up to five times — once for each role they qualified in.
 */
export function roleCategories(data: AwardsData, iconOf: (puuid: string) => number | null): AwardCategories {
  const out = {} as AwardCategories;
  for (const key of AWARD_ROLE_KEYS) {
    out[key] = data.playerRoleAwards[key].map((n) => roleNomineeView(n, iconOf(n.puuid)));
  }
  return out;
}

/** Signature-pick categories: a player on one champion. */
export function pickCategories(data: AwardsData): AwardCategories {
  const out = {} as AwardCategories;
  for (const key of AWARD_ROLE_KEYS) {
    out[key] = data.signaturePickAwards[key].map(pickNomineeView);
  }
  return out;
}
