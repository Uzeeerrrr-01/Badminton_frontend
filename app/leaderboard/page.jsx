"use client";

import { useState, useEffect } from "react";
import PublicNavbar from "@/components/PublicNavbar";
import PublicFooter from "@/components/PublicFooter";
import { Trophy, Award, History, Info, Filter } from "lucide-react";

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
    <div className="min-h-screen flex flex-col bg-background">
      <PublicNavbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="w-6 h-6 text-amber-500" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">
              Tournament Standings & Leaderboard
            </h1>
          </div>
          <p className="text-sm text-muted">
            Official cumulative rankings, match records, and traceable points history.
          </p>
        </div>

        {/* Tournament Points System Rule Info Card */}
        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 text-xs text-emerald-950 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-2.5">
            <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Official Scoring & Point System:</span> Win awards{" "}
              <span className="font-semibold text-emerald-800">
                +{settings?.points_per_win || 3} pts
              </span>
              ; participation awards{" "}
              <span className="font-semibold text-emerald-800">
                +{settings?.points_per_participation || 1} pt
              </span>
              . Tie-breakers are resolved by head-to-head score differential and win ratio.
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-semibold text-emerald-800 shrink-0">
            <Award className="w-4 h-4" />
            <span>Shortened 11-Pt Matches</span>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 rounded-xl border border-border bg-surface shadow-subtle mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCategory(c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                  selectedCategory === c
                    ? "bg-primary text-white font-semibold"
                    : "text-muted hover:text-primary hover:bg-slate-100"
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
              className="text-xs px-3 py-1.5 border border-border rounded-lg bg-white text-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="both">All (Players & Teams)</option>
              <option value="player">Individual Players Only</option>
              <option value="team">Teams / Pairs Only</option>
            </select>
          </div>
        </div>

        {/* Standings Table */}
        <div className="bg-surface rounded-2xl border border-border shadow-subtle overflow-hidden mb-12">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-border text-muted font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Rank</th>
                  <th className="py-3.5 px-4">Participant / Team</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4 text-center">Type</th>
                  <th className="py-3.5 px-4 text-center">Played</th>
                  <th className="py-3.5 px-4 text-center">Wins</th>
                  <th className="py-3.5 px-4 text-center">Losses</th>
                  <th className="py-3.5 px-4 text-center">Points (F - A)</th>
                  <th className="py-3.5 px-4 text-center">Diff</th>
                  <th className="py-3.5 px-4 text-right">Tournament Pts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredLeaderboard.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-10 text-center text-muted">
                      No leaderboard standings available for this selection.
                    </td>
                  </tr>
                ) : (
                  filteredLeaderboard.map((row, idx) => {
                    const diff = (row.points_scored || 0) - (row.points_conceded || 0);

                    return (
                      <tr key={row.id || idx} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-4 px-4 font-bold text-primary">
                          {idx === 0 ? (
                            <span className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 inline-flex items-center justify-center text-xs font-black shadow-xs">
                              1
                            </span>
                          ) : idx === 1 ? (
                            <span className="w-6 h-6 rounded-full bg-slate-300 text-slate-900 inline-flex items-center justify-center text-xs font-black shadow-xs">
                              2
                            </span>
                          ) : idx === 2 ? (
                            <span className="w-6 h-6 rounded-full bg-amber-700 text-white inline-flex items-center justify-center text-xs font-black shadow-xs">
                              3
                            </span>
                          ) : (
                            <span className="text-muted ml-2">{idx + 1}</span>
                          )}
                        </td>
                        <td className="py-4 px-4 font-bold text-primary text-sm">
                          {row.entity_name}
                        </td>
                        <td className="py-4 px-4 text-muted">{row.category}</td>
                        <td className="py-4 px-4 text-center">
                          <span className="uppercase text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            {row.entity_type}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center text-muted">{row.matches_played}</td>
                        <td className="py-4 px-4 text-center font-bold text-emerald-700">
                          {row.matches_won}
                        </td>
                        <td className="py-4 px-4 text-center text-muted">{row.matches_lost}</td>
                        <td className="py-4 px-4 text-center font-mono text-muted">
                          {row.points_scored} - {row.points_conceded}
                        </td>
                        <td className={`py-4 px-4 text-center font-mono font-semibold ${diff > 0 ? "text-emerald-700" : diff < 0 ? "text-rose-600" : "text-muted"}`}>
                          {diff > 0 ? `+${diff}` : diff}
                        </td>
                        <td className="py-4 px-4 text-right font-mono font-bold text-emerald-800 text-base">
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
            <h3 className="text-lg font-bold text-primary">Points Adjustment & Event Log</h3>
          </div>

          <div className="bg-surface rounded-xl border border-border shadow-subtle overflow-hidden">
            <div className="divide-y divide-border max-h-72 overflow-y-auto">
              {history.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted">
                  No point adjustments or match completions logged yet.
                </div>
              ) : (
                history.map((h) => (
                  <div key={h.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors">
                    <div>
                      <div className="font-semibold text-primary">{h.entity_name}</div>
                      <div className="text-[11px] text-muted mt-0.5">
                        {h.category} • Reason: <span className="text-slate-700">{h.reason}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`font-mono font-bold text-sm ${h.points_delta >= 0 ? "text-emerald-700" : "text-rose-600"}`}>
                        {h.points_delta >= 0 ? `+${h.points_delta}` : h.points_delta} pts
                      </span>
                      <div className="text-[10px] text-muted">By {h.adjusted_by}</div>
                    </div>
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
