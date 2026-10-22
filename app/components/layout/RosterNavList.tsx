"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flame } from "lucide-react";
import ProfileIcon from "@/app/components/ui/ProfileIcon";
import { TIER_COLORS } from "@/app/data/constants";
import { formatTier } from "@/app/lib/format";
import { cn } from "@/app/lib/utils";
import type { RankDivision, RankTier } from "@/app/types/riot";

export interface RosterNavPlayer {
  puuid: string;
  gameName: string;
  href: string;
  profileIconId: number | null;
  tier: RankTier | null;
  division: RankDivision | null;
  lp: number | null;
  hotStreak: boolean;
}

interface RosterNavListProps {
  players: RosterNavPlayer[];
  version: string;
}

export default function RosterNavList({ players, version }: RosterNavListProps) {
  const pathname = usePathname();

  return (
    <nav aria-label="Players" className="flex flex-col gap-0.5">
      {players.map((p) => {
        const active = decodeURIComponent(pathname) === decodeURIComponent(p.href);
        return (
          <Link
            key={p.puuid}
            href={p.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors",
              active ? "bg-muted" : "hover:bg-muted",
            )}
          >
            <ProfileIcon
              iconId={p.profileIconId}
              version={version}
              size={26}
              className={cn(active && "ring-primary")}
            />
            <span className="min-w-0 flex-1">
              <span
                className={cn(
                  "flex items-center gap-1 truncate text-[13px] font-medium",
                  active ? "text-foreground" : "text-muted-foreground group-hover:text-foreground",
                )}
              >
                <span className="truncate">{p.gameName}</span>
                {p.hotStreak && <Flame className="size-3 shrink-0 text-cir-dominant" aria-label="Hot streak" />}
              </span>
              <span
                className="num block truncate text-[11px]"
                style={{ color: p.tier ? TIER_COLORS[p.tier] : undefined }}
              >
                {p.tier ? `${formatTier(p.tier, p.division ?? undefined)} · ${p.lp} LP` : "Unranked"}
              </span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
