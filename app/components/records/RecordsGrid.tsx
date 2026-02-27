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
} from "lucide-react";
import CirLeaderboardCard from "./CirLeaderboardCard";
import PentakillCard from "./PentakillCard";
import RecordCard from "./RecordCard";
import {
  BEST_ORDER,
  CIR_TABS,
  WORST_CIR_TABS,
  WORST_ORDER,
  cirLabel,
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
            className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
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
  const [pageTab, setPageTab] = useState<"records" | "cir">("records");
  const [cirTab, setCirTab] = useState<string>("Top CIR");
  const [worstTab, setWorstTab] = useState<string>("Worst CIR");

  const recordMap = new Map(records.map((r) => [r.category, r]));

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
  const activeWorstList = worstByCategory.get(worstTab) ?? [];

  // ── Player stats: appearances in per-role top-15 + legendary count ──
  // Count appearances across all ROLE tabs only (exclude Overall)
  const ROLE_KEYS = [
    "Top CIR TOP",
    "Top CIR JUNGLE",
    "Top CIR MIDDLE",
    "Top CIR BOTTOM",
    "Top CIR UTILITY",
  ];
  const appearancesMap = new Map<string, number>();
  const legendaryMap = new Map<string, number>();
  for (const key of ROLE_KEYS) {
    const list = cirByCategory.get(key) ?? [];
    for (const r of list) {
      appearancesMap.set(r.gameName, (appearancesMap.get(r.gameName) ?? 0) + 1);
      if (r.value >= 20) {
        legendaryMap.set(r.gameName, (legendaryMap.get(r.gameName) ?? 0) + 1);
      }
    }
  }
  const appearanceRanking = [...appearancesMap.entries()].sort(
    (a, b) => b[1] - a[1],
  );
  const legendaryRanking = [...legendaryMap.entries()].sort(
    (a, b) => b[1] - a[1],
  );

  const hasPlayerStats = appearanceRanking.length > 0;

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
                Counted across per-role top-15 leaderboards only (not Overall
                tab)
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 stagger-grid">
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Top-15 Appearances
                  </p>
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
                </div>

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
                      {legendaryRanking.map(([name, count], i) => {
                        const { color } = cirLabel(20);
                        return (
                          <div key={name} className="flex items-center gap-2">
                            <span
                              className={`w-5 text-center text-xs font-bold tabular-nums ${i === 0 ? "text-yellow-400" : i === 1 ? "text-zinc-300" : i === 2 ? "text-amber-600" : "text-zinc-600"}`}
                            >
                              {i + 1}
                            </span>
                            <span className="flex-1 truncate text-sm font-medium text-zinc-200">
                              {name}
                            </span>
                            <span
                              className={`tabular-nums text-sm font-bold ${color}`}
                            >
                              {count}
                            </span>
                            <span className="text-xs text-zinc-600">
                              × Legendary
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {hasCir && (
            <section>
              <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">
                <Activity className="h-4 w-4 text-amber-400" />
                Top 15 Performances — CIR
              </h2>
              <p className="mb-3 text-xs text-zinc-600">
                Competitive Impact Rating · combat, utility, economy &amp;
                pressure · role-weighted
              </p>
              <TabBar
                tabs={CIR_TABS}
                active={cirTab}
                byCategory={cirByCategory}
                onSelect={setCirTab}
                activeColor="bg-amber-500/20 text-amber-300 border-amber-500/40"
              />
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
            </section>
          )}

          {hasWorst && (
            <section>
              <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">
                <TrendingDown className="h-4 w-4 text-red-400" />
                Worst 10 Performances — CIR
              </h2>
              <p className="mb-3 text-xs text-zinc-600">
                Lowest Competitive Impact Rating scores · role-weighted
              </p>
              <TabBar
                tabs={WORST_CIR_TABS}
                active={worstTab}
                byCategory={worstByCategory}
                onSelect={setWorstTab}
                activeColor="bg-red-500/20 text-red-300 border-red-500/40"
              />
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
            </section>
          )}
        </div>
      )}
    </div>
  );
}
