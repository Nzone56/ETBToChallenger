"use client";

import { useState } from "react";
import type { MatchRecord } from "@/app/lib/db";
import type { PentakillEvent } from "@/app/lib/db";
import {
  Skull,
  Star,
  Trophy,
  Activity,
  TrendingDown,
  Crown,
  Zap,
} from "lucide-react";
import CirLeaderboardCard from "./CirLeaderboardCard";
import PentakillCard from "./PentakillCard";
import RecordCard from "./RecordCard";
import { DeltaLeaderboardCard } from "./DeltaLeaderboardCard";
import { DELTA_LEADERBOARDS, DELTA_LEADERBOARD_ORDER } from "./DeltaConfig";
import {
  BEST_ORDER,
  CIR_TABS,
  WORST_CIR_TABS,
  WORST_ORDER,
} from "./RecordData";

interface RecordsGridProps {
  records: MatchRecord[];
  pentakills: PentakillEvent[];
  version: string;
}

function TabBar({
  tabs,
  active,
  byCategory,
  onSelect,
  activeColor,
}: {
  tabs: readonly { key: string; label: string }[];
  active: string;
  byCategory: Map<string, MatchRecord[]>;
  onSelect: (key: string) => void;
  activeColor: string;
}) {
  return (
    <div className="mb-4 flex flex-wrap gap-1">
      {tabs.map((tab) => {
        const count = byCategory.get(tab.key)?.length ?? 0;
        const isActive = active === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onSelect(tab.key)}
            disabled={count === 0}
            className={`cursor-pointer rounded-lg px-2 sm:px-3 py-1.5 text-xs font-semibold transition-colors ${
              isActive
                ? `${activeColor} border`
                : count === 0
                  ? "cursor-not-allowed text-zinc-700"
                  : "border border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export default function RecordsGrid({
  records,
  pentakills,
  version,
}: RecordsGridProps) {
  const [pageTab, setPageTab] = useState<"records" | "cir" | "delta">(
    "records",
  );
  const [cirTab, setCirTab] = useState<string>("Top CIR");

  // Build recordMap - for delta categories, only take the first (top) record
  const recordMap = new Map<string, MatchRecord>();
  const deltaCategories = new Set([
    DELTA_LEADERBOARDS.titan.categoryName,
    DELTA_LEADERBOARDS.anchor.categoryName,
    DELTA_LEADERBOARDS.king.categoryName,
    DELTA_LEADERBOARDS.gap.categoryName,
  ]);

  for (const r of records) {
    if (deltaCategories.has(r.category)) {
      // For delta categories, only store if not already present (first = top)
      if (!recordMap.has(r.category)) {
        recordMap.set(r.category, r);
      }
    } else {
      // For regular categories, just store (should be unique anyway)
      recordMap.set(r.category, r);
    }
  }

  // ── Extract Delta Leaderboards ──
  const deltaRecordsByType: Record<string, MatchRecord[]> = {
    titan: records.filter(
      (r) => r.category === DELTA_LEADERBOARDS.titan.categoryName,
    ),
    anchor: records.filter(
      (r) => r.category === DELTA_LEADERBOARDS.anchor.categoryName,
    ),
    king: records.filter(
      (r) => r.category === DELTA_LEADERBOARDS.king.categoryName,
    ),
    gap: records.filter(
      (r) => r.category === DELTA_LEADERBOARDS.gap.categoryName,
    ),
  };
  const hasDeltaRecords = Object.values(deltaRecordsByType).some(
    (list) => list.length > 0,
  );

  // ── Build Top CIR category map ──
  const cirByCategory = new Map<string, MatchRecord[]>();
  for (const r of records) {
    if (!r.category.startsWith("Top CIR")) continue;
    const list = cirByCategory.get(r.category) ?? [];
    list.push(r);
    cirByCategory.set(r.category, list);
  }
  for (const list of cirByCategory.values())
    list.sort((a, b) => b.value - a.value);

  // ── Build Worst CIR category map ──
  const worstByCategory = new Map<string, MatchRecord[]>();
  for (const r of records) {
    if (!r.category.startsWith("Worst CIR")) continue;
    const list = worstByCategory.get(r.category) ?? [];
    list.push(r);
    worstByCategory.set(r.category, list);
  }
  // Worst = ascending (lowest score first)
  for (const list of worstByCategory.values())
    list.sort((a, b) => a.value - b.value);

  const hasCir = CIR_TABS.some(
    (t) => (cirByCategory.get(t.key)?.length ?? 0) > 0,
  );
  const hasWorst = WORST_CIR_TABS.some(
    (t) => (worstByCategory.get(t.key)?.length ?? 0) > 0,
  );

  const activeCirList = cirByCategory.get(cirTab) ?? [];
  // Use same tab filter for worst - convert "Top CIR" to "Worst CIR" etc.
  const worstTabKey = cirTab.replace("Top CIR", "Worst CIR");
  const activeWorstList = worstByCategory.get(worstTabKey) ?? [];

  // ── Player stats: appearances in per-role top-15 + legendary count ──
  // Count appearances across all ROLE tabs only (exclude Overall)
  const ROLE_KEYS = [
    "Top CIR TOP",
    "Top CIR JUNGLE",
    "Top CIR MIDDLE",
    "Top CIR BOTTOM",
    "Top CIR UTILITY",
  ];
  const WORST_ROLE_KEYS = [
    "Worst CIR TOP",
    "Worst CIR JUNGLE",
    "Worst CIR MIDDLE",
    "Worst CIR BOTTOM",
    "Worst CIR UTILITY",
  ];
  const appearancesMap = new Map<string, number>();
  const legendaryMap = new Map<string, number>();
  const worstAppearancesMap = new Map<string, number>();
  const poorMap = new Map<string, number>();

  // Count top-15 appearances and legendary performances
  for (const key of ROLE_KEYS) {
    const list = cirByCategory.get(key) ?? [];
    for (const r of list) {
      appearancesMap.set(r.gameName, (appearancesMap.get(r.gameName) ?? 0) + 1);
      if (r.value >= 20) {
        legendaryMap.set(r.gameName, (legendaryMap.get(r.gameName) ?? 0) + 1);
      }
    }
  }

  // Count worst-15 appearances and poor performances
  for (const key of WORST_ROLE_KEYS) {
    const list = worstByCategory.get(key) ?? [];
    for (const r of list) {
      worstAppearancesMap.set(
        r.gameName,
        (worstAppearancesMap.get(r.gameName) ?? 0) + 1,
      );
      if (r.value < 6) {
        poorMap.set(r.gameName, (poorMap.get(r.gameName) ?? 0) + 1);
      }
    }
  }

  const appearanceRanking = [...appearancesMap.entries()].sort(
    (a, b) => b[1] - a[1],
  );
  const legendaryRanking = [...legendaryMap.entries()].sort(
    (a, b) => b[1] - a[1],
  );
  const worstAppearanceRanking = [...worstAppearancesMap.entries()].sort(
    (a, b) => b[1] - a[1],
  );
  const poorRanking = [...poorMap.entries()].sort((a, b) => b[1] - a[1]);

  const hasPlayerStats =
    appearanceRanking.length > 0 || worstAppearanceRanking.length > 0;

  return (
    <div className="space-y-6">
      {/* ── Page-level tab switcher ── */}
      <div className="flex gap-2 border-b border-zinc-800 pb-1">
        <button
          onClick={() => setPageTab("records")}
          className={`cursor-pointer flex items-center gap-1.5 px-4 py-2 text-sm font-semibold transition-colors rounded-t-lg ${
            pageTab === "records"
              ? "border-b-2 border-yellow-400 text-yellow-300"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <Trophy className="h-4 w-4" />
          Records
        </button>
        <button
          onClick={() => setPageTab("cir")}
          className={`cursor-pointer flex items-center gap-1.5 px-4 py-2 text-sm font-semibold transition-colors rounded-t-lg ${
            pageTab === "cir"
              ? "border-b-2 border-amber-400 text-amber-300"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <Activity className="h-4 w-4" />
          CIR
        </button>
        {hasDeltaRecords && (
          <button
            onClick={() => setPageTab("delta")}
            className={`cursor-pointer flex items-center gap-1.5 px-4 py-2 text-sm font-semibold transition-colors rounded-t-lg ${
              pageTab === "delta"
                ? "border-b-2 border-cyan-400 text-cyan-300"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Zap className="h-4 w-4" />
            Delta
          </button>
        )}
      </div>

      {/* ── RECORDS TAB ── */}
      {pageTab === "records" && (
        <div className="space-y-10">
          <section>
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">
              <Trophy className="h-4 w-4 text-yellow-400" />
              Records
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 stagger-grid">
              {BEST_ORDER.map((cat) => {
                const record = recordMap.get(cat);
                if (!record) return null;
                return (
                  <RecordCard key={cat} record={record} version={version} />
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">
              <Skull className="h-4 w-4 text-red-500" />
              {"Records'nt"}
              <span className="text-xs font-normal text-zinc-600">
                (excl. support for farm/gold/dmg)
              </span>
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 stagger-grid">
              {WORST_ORDER.map((cat) => {
                const record = recordMap.get(cat);
                if (!record) return null;
                return (
                  <RecordCard key={cat} record={record} version={version} />
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">
              <Star className="h-4 w-4 text-indigo-400" />
              Pentakill Counter
              <span className="text-xs font-normal text-zinc-600">
                ({pentakills.reduce((s, e) => s + e.pentaKills, 0)} total)
              </span>
            </h2>
            {pentakills.length === 0 ? (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 text-center text-sm text-zinc-500">
                No pentakills yet — go get one!
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {pentakills.map((e) => (
                  <PentakillCard
                    key={e.matchId + e.puuid}
                    event={e}
                    version={version}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* ── CIR TAB ── */}
      {pageTab === "cir" && (
        <div className="space-y-10">
          {hasPlayerStats && (
            <section>
              <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">
                <Crown className="h-4 w-4 text-violet-400" />
                CIR Player Rankings
              </h2>
              <p className="mb-4 text-xs text-zinc-600">
                Counted across per-role leaderboards only (not Overall tab)
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 stagger-grid">
                {/* Top-15 Appearances */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Top-15 Appearances
                  </p>
                  {appearanceRanking.length === 0 ? (
                    <p className="text-xs text-zinc-600 italic">
                      No top-15 appearances yet
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {appearanceRanking.map(([name, count], i) => (
                        <div key={name} className="flex items-center gap-2">
                          <span
                            className={`w-5 text-center text-xs font-bold tabular-nums ${i === 0 ? "text-yellow-400" : i === 1 ? "text-zinc-300" : i === 2 ? "text-amber-600" : "text-zinc-600"}`}
                          >
                            {i + 1}
                          </span>
                          <span className="flex-1 truncate text-sm font-medium text-zinc-200">
                            {name}
                          </span>
                          <span className="tabular-nums text-sm font-bold text-violet-400">
                            {count}
                          </span>
                          <span className="text-xs text-zinc-600">entries</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Legendary Performances */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Legendary Performances{" "}
                    <span className="text-yellow-400/60">(≥20 CIR)</span>
                  </p>
                  {legendaryRanking.length === 0 ? (
                    <p className="text-xs text-zinc-600 italic">
                      No legendary performances yet
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {legendaryRanking.map(([name, count], i) => (
                        <div key={name} className="flex items-center gap-2">
                          <span
                            className={`w-5 text-center text-xs font-bold tabular-nums ${i === 0 ? "text-yellow-400" : i === 1 ? "text-zinc-300" : i === 2 ? "text-amber-600" : "text-zinc-600"}`}
                          >
                            {i + 1}
                          </span>
                          <span className="flex-1 truncate text-sm font-medium text-zinc-200">
                            {name}
                          </span>
                          <span className="tabular-nums text-sm font-bold text-zinc-400">
                            {count}
                          </span>
                          <span className="text-xs text-zinc-600">
                            × Legendary
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Worst-15 Appearances */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Worst-15 Appearances
                  </p>
                  {worstAppearanceRanking.length === 0 ? (
                    <p className="text-xs text-zinc-600 italic">
                      No worst-15 appearances yet
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {worstAppearanceRanking.map(([name, count], i) => (
                        <div key={name} className="flex items-center gap-2">
                          <span
                            className={`w-5 text-center text-xs font-bold tabular-nums ${i === 0 ? "text-red-400" : i === 1 ? "text-red-500" : i === 2 ? "text-red-600" : "text-zinc-600"}`}
                          >
                            {i + 1}
                          </span>
                          <span className="flex-1 truncate text-sm font-medium text-zinc-200">
                            {name}
                          </span>
                          <span className="tabular-nums text-sm font-bold text-red-400">
                            {count}
                          </span>
                          <span className="text-xs text-zinc-600">entries</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Poor Performances */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Poor Performances{" "}
                    <span className="text-red-400/60">(&lt;6 CIR)</span>
                  </p>
                  {poorRanking.length === 0 ? (
                    <p className="text-xs text-zinc-600 italic">
                      No poor performances yet
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {poorRanking.map(([name, count], i) => (
                        <div key={name} className="flex items-center gap-2">
                          <span
                            className={`w-5 text-center text-xs font-bold tabular-nums ${i === 0 ? "text-red-400" : i === 1 ? "text-red-500" : i === 2 ? "text-red-600" : "text-zinc-600"}`}
                          >
                            {i + 1}
                          </span>
                          <span className="flex-1 truncate text-sm font-medium text-zinc-200">
                            {name}
                          </span>
                          <span className="tabular-nums text-sm font-bold text-zinc-400">
                            {count}
                          </span>
                          <span className="text-xs text-zinc-600">× Poor</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {(hasCir || hasWorst) && (
            <section>
              <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">
                <Activity className="h-4 w-4 text-amber-400" />
                Top & Worst 15 Performances — CIR
              </h2>
              <p className="mb-3 text-xs text-zinc-600">
                Competitive Impact Rating · role-weighted
              </p>
              <TabBar
                tabs={CIR_TABS}
                active={cirTab}
                byCategory={cirByCategory}
                onSelect={setCirTab}
                activeColor="bg-amber-500/20 text-amber-300 border-amber-500/40"
              />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Top 15 */}
                {hasCir && (
                  <div>
                    <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      <Trophy className="h-3.5 w-3.5 text-amber-400" />
                      Top 15
                    </h3>
                    <div className="flex flex-col gap-2 stagger-grid">
                      {activeCirList.length === 0 ? (
                        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 text-center text-sm text-zinc-500">
                          No data for this role yet
                        </div>
                      ) : (
                        activeCirList.map((record, i) => (
                          <CirLeaderboardCard
                            key={record.matchId + record.puuid + i}
                            record={record}
                            rank={i + 1}
                            version={version}
                          />
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Worst 15 */}
                {hasWorst && (
                  <div>
                    <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      <TrendingDown className="h-3.5 w-3.5 text-red-400" />
                      Worst 15
                    </h3>
                    <div className="flex flex-col gap-2 stagger-grid">
                      {activeWorstList.length === 0 ? (
                        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 text-center text-sm text-zinc-500">
                          No data for this role yet
                        </div>
                      ) : (
                        activeWorstList.map((record, i) => (
                          <CirLeaderboardCard
                            key={record.matchId + record.puuid + i}
                            record={record}
                            rank={i + 1}
                            version={version}
                          />
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      )}

      {/* ── DELTA TAB ── */}
      {pageTab === "delta" && (
        <div className="space-y-6">
          <div className="mb-4">
            <h2 className="mb-2 flex items-center gap-2 text-lg font-bold uppercase tracking-wider text-zinc-200">
              <Zap className="h-5 w-5 text-cyan-400" />
              CIR Delta Leaderboards
            </h2>
            <p className="text-sm text-zinc-500">
              Top 10 performances by CIR difference vs teammates or lane
              opponents
            </p>
          </div>

          {/* Bento Grid: 2x2 on desktop, stacked on mobile */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {DELTA_LEADERBOARD_ORDER.map((key) => {
              const config = DELTA_LEADERBOARDS[key];
              const records = deltaRecordsByType[key];
              const Icon = config.icon;

              return (
                <section key={key} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-5 w-5 ${config.iconColor}`} />
                    <h3
                      className={`text-base font-bold uppercase tracking-wider ${config.theme.titleColor}`}
                    >
                      {config.title}
                    </h3>
                    <span className="ml-auto text-xs text-zinc-600">
                      {config.subtitle}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500">{config.description}</p>
                  {records.length === 0 ? (
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-8 text-center text-sm text-zinc-500">
                      No {config.title.toLowerCase()} performances yet
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {records.map((record, i) => (
                        <DeltaLeaderboardCard
                          key={record.matchId + record.puuid}
                          record={record}
                          rank={i + 1}
                          version={version}
                          type={config.type}
                        />
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
