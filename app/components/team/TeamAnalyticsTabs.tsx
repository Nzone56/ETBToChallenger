"use client";

import { useState, useEffect } from "react";
import { RukawaAnalytics } from "@/app/lib/rukawaAnalytics";
import RukawaFiles from "./RukawaFiles";
import { FileWarning, BarChart3 } from "lucide-react";
import { cn } from "@/app/lib/utils";

interface TeamAnalyticsTabsProps {
  children: React.ReactNode;
}

export default function TeamAnalyticsTabs({
  children,
}: TeamAnalyticsTabsProps) {
  const [activeTab, setActiveTab] = useState<"team" | "rukawa">("team");
  const [rukawaData, setRukawaData] = useState<RukawaAnalytics | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === "rukawa" && !rukawaData) {
      let cancelled = false;

      const loadData = async () => {
        try {
          setLoading(true);
          const res = await fetch("/api/rukawa-analytics");
          const data = await res.json();
          if (!cancelled) {
            setRukawaData(data);
          }
        } catch (err) {
          console.error("Failed to load Rukawa analytics:", err);
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
      };

      loadData();

      return () => {
        cancelled = true;
      };
    }
  }, [activeTab, rukawaData]);

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 p-1">
        <button
          onClick={() => setActiveTab("team")}
          className={cn(
            "cursor-pointer flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all",
            activeTab === "team"
              ? "bg-teal-500/20 text-teal-400 shadow-lg shadow-teal-500/10"
              : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200",
          )}
        >
          <BarChart3 className="h-4 w-4" />
          Team Analytics
        </button>
        <button
          onClick={() => setActiveTab("rukawa")}
          className={cn(
            "cursor-pointer flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all",
            activeTab === "rukawa"
              ? "bg-orange-500/20 text-orange-400 shadow-lg shadow-orange-500/10"
              : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200",
          )}
        >
          <FileWarning className="h-4 w-4" />
          🔒 The Rukawa Files
        </button>
      </div>

      {/* Content */}
      {activeTab === "team" ? (
        children
      ) : loading ? (
        <div className="flex min-h-[400] items-center justify-center">
          <div className="text-center">
            <div className="mb-4 text-4xl">🔍</div>
            <div className="text-lg font-semibold text-orange-400">
              Analyzing classified data...
            </div>
            <div className="text-sm text-zinc-500">
              Compiling roast material
            </div>
          </div>
        </div>
      ) : rukawaData ? (
        <RukawaFiles analytics={rukawaData} />
      ) : (
        <div className="flex min-h-400 items-center justify-center">
          <div className="text-center text-zinc-500">
            Failed to load analytics
          </div>
        </div>
      )}
    </div>
  );
}
