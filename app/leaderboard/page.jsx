"use client";

import { useState, useEffect } from "react";
import PublicNavbar from "@/components/PublicNavbar";
import PublicFooter from "@/components/PublicFooter";
import { Trophy, Award, History, Info, Filter, ShieldCheck, ChevronRight } from "lucide-react";

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [history, setHistory] = useState([]);
  const [settings, setSettings] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [entityType, setEntityType] = useState("both");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      fetch("/api/points", { cache: "no-store" }).then((r) => (r.ok ? r.json() : {})),
      fetch("/api/settings", { cache: "no-store" }).then((r) => (r.ok ? r.json() : {})),
    ])
      .then(([ptRes, sRes]) => {
        const ptData = ptRes.status === "fulfilled" ? ptRes.value || {} : {};
        const sData = sRes.status === "fulfilled" ? sRes.value || {} : {};
        setLeaderboard(ptData.leaderboard || []);
        setHistory(ptData.history || []);
        setSettings(sData.settings || null);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const categories = [
    "All",
    "Men's Singles",
    "Women's Singles",
    "Men's Doubles",
    "Women's Doubles",
    "Mixed Doubles",
  ];

  const filteredLeaderboard = leaderboard.filter((item) => {
    if (selectedCategory !== "All" && item.category !== selectedCategory) return false;
    if (entityType !== "both" && item.entity_type !== entityType) return false;
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-accent-light selection:text-accent">
      <PublicNavbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-border mb-3">
            <Trophy className="w-3.5 h-3.5 text-amber-600" />
            <span>OFFICIAL CHAMPIONSHIP STANDINGS</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-heading font-black text-primary tracking-tight">
            Tournament Standings & Leaderboard
          </h1>
          <p className="text-sm text-secondary mt-1 max-w-2xl">
            Official cumulative rankings, match victories, rally point differentials, and verified tournament points.
          </p>
        </div>

        {/* Tournament Points System Rule Info Card */}
        <div className="p-4 rounded-2xl border border-accent-border bg-accent-light/40 text-xs text-primary mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-subtle">
          <div className="flex items-start gap-2.5">
            <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
            <div className="text-secondary leading-relaxed">
              <span className="font-heading font-bold text-primary">Official Scoring & Point System:</span>{" "}
              Match win awards <span className="font-bold text-accent">+{settings?.points_per_win || 3} pts</span>; participation awards{" "}
              <span className="font-bold text-accent">+{settings?.points_per_participation || 1} pt</span>. Tie-breakers are resolved by head-to-head score differential and win percentage.
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-accent bg-white px-3 py-1.5 rounded-xl border border-accent-border shrink-0 shadow-subtle">
            <Award className="w-4 h-4" />
            <span>11-Pt Fast Rally Format</span>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 rounded-2xl border border-border bg-white shadow-subtle mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCategory(c)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  selectedCategory === c
                    ? "bg-accent text-white shadow-emerald"
                    : "text-secondary hover:text-primary hover:bg-slate-50"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <select
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
              className="text-xs px-3.5 py-1.5 border border-border rounded-xl bg-slate-50 text-primary font-semibold focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
            >
              <option value="both">All (Players & Teams)</option>
              <option value="player">Individual Competitors Only</option>
              <option value="team">Pairs / Teams Only</option>
            </select>
          </div>
        </div>

        {/* Standings Table */}
        <div className="bg-white rounded-2xl border border-border shadow-card overflow-hidden mb-12">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-border text-secondary font-heading font-black uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Rank</th>
                  <th className="py-3.5 px-4">Participant / Team</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4 text-center">Type</th>
                  <th className="py-3.5 px-4 text-center">Played</th>
                  <th className="py-3.5 px-4 text-center">Wins</th>
                  <th className="py-3.5 px-4 text-center">Losses</th>
                  <th className="py-3.5 px-4 text-center">Rally Points</th>
                  <th className="py-3.5 px-4 text-center">Diff</th>
                  <th className="py-3.5 px-4 text-right">Tournament Pts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredLeaderboard.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-14 text-center text-muted">
                      No leaderboard standings recorded for this category yet.
                    </td>
                  </tr>
                ) : (
                  filteredLeaderboard.map((row, idx) => {
                    const diff = (row.points_scored || 0) - (row.points_conceded || 0);

                    return (
                      <tr key={row.id || idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-4 font-bold text-primary">
                          {idx === 0 ? (
                            <span className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 inline-flex items-center justify-center text-xs font-heading font-black shadow-xs">
                              1
                            </span>
                          ) : idx === 1 ? (
                            <span className="w-6 h-6 rounded-full bg-slate-300 text-slate-900 inline-flex items-center justify-center text-xs font-heading font-black shadow-xs">
                              2
                            </span>
                          ) : idx === 2 ? (
                            <span className="w-6 h-6 rounded-full bg-amber-700 text-white inline-flex items-center justify-center text-xs font-heading font-black shadow-xs">
                              3
                            </span>
                          ) : (
                            <span className="text-muted ml-2 font-mono font-bold">{idx + 1}</span>
                          )}
                        </td>
                        <td className="py-4 px-4 font-heading font-bold text-primary text-sm">
                          {row.entity_name}
                        </td>
                        <td className="py-4 px-4 text-secondary">{row.category}</td>
                        <td className="py-4 px-4 text-center">
                          <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                            {row.entity_type}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center text-secondary">{row.matches_played}</td>
                        <td className="py-4 px-4 text-center font-bold text-accent">
                          {row.matches_won}
                        </td>
                        <td className="py-4 px-4 text-center text-secondary">{row.matches_lost}</td>
                        <td className="py-4 px-4 text-center font-mono text-secondary">
                          {row.points_scored} : {row.points_conceded}
                        </td>
                        <td
                          className={`py-4 px-4 text-center font-mono font-bold ${
                            diff > 0 ? "text-accent" : diff < 0 ? "text-rose-600" : "text-secondary"
                          }`}
                        >
                          {diff > 0 ? `+${diff}` : diff}
                        </td>
                        <td className="py-4 px-4 text-right font-mono font-black text-accent text-base">
                          {row.total_tournament_points} pts
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Traceable Points Adjustment Log */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <History className="w-4 h-4 text-primary" />
            <h3 className="text-lg font-heading font-black text-primary">
              Points Adjustment & Event History Log
            </h3>
          </div>

          <div className="bg-white rounded-2xl border border-border shadow-subtle overflow-hidden">
            <div className="divide-y divide-border max-h-72 overflow-y-auto">
              {history.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted">
                  No point adjustments or match completions logged yet.
                </div>
              ) : (
                history.map((h) => (
                  <div
                    key={h.id}
                    className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors"
                  >
                    <div>
                      <span className="font-bold text-primary">{h.entity_name}</span>
                      <span className="text-secondary ml-2 text-[11px]">{h.reason}</span>
                    </div>
                    <span className="font-mono font-bold text-accent">
                      {h.points_delta > 0 ? `+${h.points_delta}` : h.points_delta} pts
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
