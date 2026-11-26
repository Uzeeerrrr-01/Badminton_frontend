"use client";

import { useState, useEffect } from "react";
import PublicNavbar from "@/components/PublicNavbar";
import PublicFooter from "@/components/PublicFooter";
import { useLiveLeaderboard } from "@/lib/useLiveLeaderboard";
import {
  Trophy,
  Award,
  History,
  Info,
  Filter,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  Crown,
  Users,
  User,
  Sparkles,
  Flame,
  Layers,
  ListOrdered,
} from "lucide-react";

const CATEGORIES = [
  "All",
  "Men's Singles",
  "Women's Singles",
  "Men's Doubles",
  "Women's Doubles",
  "Mixed Doubles",
];

const SPECIFIC_CATEGORIES = [
  "Men's Singles",
  "Women's Singles",
  "Men's Doubles",
  "Women's Doubles",
  "Mixed Doubles",
];

export default function LeaderboardPage() {
  const { leaderboard, history, settings, categoryLeaders, loading } = useLiveLeaderboard({
    includeSettings: true,
  });
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [entityType, setEntityType] = useState("both");
  const [viewMode, setViewMode] = useState("grouped"); // "grouped" | "table"

  // Pagination state for table view
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, entityType, viewMode]);

  const filteredLeaderboard = leaderboard.filter((item) => {
    if (selectedCategory !== "All" && item.category !== selectedCategory) return false;
    if (entityType !== "both" && item.entity_type !== entityType) return false;
    return true;
  });

  const totalItems = filteredLeaderboard.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedLeaderboard = filteredLeaderboard.slice(startIndex, endIndex);

  const getPageNumbers = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (safeCurrentPage <= 4) return [1, 2, 3, 4, 5, "...", totalPages];
    if (safeCurrentPage >= totalPages - 3) return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, "...", safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1, "...", totalPages];
  };

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-accent-light selection:text-accent overflow-x-hidden w-full max-w-full">
      <PublicNavbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 w-full overflow-x-hidden">
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
            Official cumulative rankings, division champions, match victories, rally point differentials, and verified tournament points.
          </p>
        </div>

        {/* =========================================================
            DIVISION TOPPERS / CATEGORY CHAMPIONS SHOWCASE
           ========================================================= */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-500" />
              <h2 className="text-base font-heading font-black text-primary uppercase tracking-wider text-xs">
                Division Leaders & Category Toppers
              </h2>
            </div>
            <span className="text-[11px] text-muted font-medium">Click category to filter rankings</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-3.5">
            {SPECIFIC_CATEGORIES.map((cat) => {
              const info = categoryLeaders[cat];
              const leader = info?.leader;
              const isSelected = selectedCategory === cat;
              const isDoubles = cat.includes("Doubles");

              return (
                <div
                  key={cat}
                  onClick={() => setSelectedCategory(isSelected ? "All" : cat)}
                  className={`p-3 sm:p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between last:col-span-2 lg:last:col-span-1 ${isSelected
                      ? "bg-accent/5 border-accent shadow-md ring-2 ring-accent/20"
                      : "bg-white border-border hover:border-slate-300 shadow-subtle hover:shadow-card"
                    }`}
                >
                  {/* Decorative golden accent */}
                  <div className="flex items-center justify-between mb-1.5 sm:mb-2 gap-1">
                    <span className="text-[10px] sm:text-[11px] font-bold text-slate-600 truncate">
                      {cat}
                    </span>
                    <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                      <Crown className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-600" />
                    </span>
                  </div>

                  {leader ? (
                    <div>
                      <div className="font-heading font-black text-primary text-xs sm:text-sm truncate" title={leader.entity_name}>
                        {leader.entity_name}
                      </div>
                      <div className="flex items-center justify-between mt-1.5 sm:mt-2 pt-1.5 sm:pt-2 border-t border-slate-100 text-[10px] sm:text-[11px]">
                        <span className="text-secondary font-medium">
                          {leader.matches_won}W - {leader.matches_lost}L
                        </span>
                        <span className="font-mono font-black text-accent text-xs">
                          {leader.total_tournament_points} pts
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="py-1.5 sm:py-2 text-[10px] sm:text-[11px] text-muted italic">
                      No matches completed yet
                    </div>
                  )}

                  <div className="mt-1.5 sm:mt-2 text-[9px] sm:text-[10px] text-muted font-medium flex items-center justify-between">
                    <span>Rank #1 in Division</span>
                    {info?.totalParticipants > 0 && (
                      <span>{info.totalParticipants} competitors</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tournament Points System Rule Info Card */}
        <div className="p-3.5 sm:p-4 rounded-2xl border border-accent-border bg-accent-light/40 text-xs text-primary mb-6 sm:mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4 shadow-subtle">
          <div className="flex items-start gap-2.5">
            <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
            <div className="text-secondary leading-relaxed text-[11px] sm:text-xs">
              <span className="font-heading font-bold text-primary">Official Scoring & Point System:</span>{" "}
              Match win awards <span className="font-bold text-accent">+{settings?.points_per_win || 3} pts</span>; participation awards{" "}
              <span className="font-bold text-accent">+{settings?.points_per_participation || 1} pt</span>. Division rank is determined by total points, match victories, and rally point differential.
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-accent bg-white px-3 py-1.5 rounded-xl border border-accent-border shrink-0 shadow-subtle self-start md:self-auto">
            <Award className="w-4 h-4" />
            <span>11-Pt Fast Rally Format</span>
          </div>
        </div>

        {/* Filters & View Mode Switcher */}
        <div className="p-3 sm:p-4 rounded-2xl border border-border bg-white shadow-subtle mb-6 sm:mb-8 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 sm:gap-4">
          {/* Mobile Category Dropdown (Zero Side-Scrolling) */}
          <div className="lg:hidden w-full">
            <div className="relative">
              <select
                aria-label="Filter leaderboard category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full text-xs font-bold px-3.5 py-2.5 rounded-xl border border-border bg-slate-50 text-primary shadow-subtle focus:outline-none focus:ring-2 focus:ring-accent/20 cursor-pointer appearance-none"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === "All" ? "All Categories" : cat}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-secondary">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Desktop Category Filter Tabs (Zero Side-Scrolling) */}
          <div className="hidden lg:flex flex-wrap items-center gap-1.5">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCategory(c)}
                className={`px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${selectedCategory === c
                    ? "bg-accent text-white shadow-emerald"
                    : "text-secondary hover:text-primary hover:bg-slate-50 border border-transparent"
                  }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2.5 w-full lg:w-auto justify-end">
            {/* View Mode Toggle when "All" is selected */}
            {selectedCategory === "All" && (
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
                <button
                  onClick={() => setViewMode("grouped")}
                  className={`flex-1 xs:flex-none px-2.5 py-1 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all ${viewMode === "grouped"
                      ? "bg-white text-primary shadow-xs"
                      : "text-muted hover:text-primary"
                    }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>By Category</span>
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`flex-1 xs:flex-none px-2.5 py-1 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all ${viewMode === "table"
                      ? "bg-white text-primary shadow-xs"
                      : "text-muted hover:text-primary"
                    }`}
                >
                  <ListOrdered className="w-3.5 h-3.5" />
                  <span>Overall Table</span>
                </button>
              </div>
            )}

            <select
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
              className="text-xs px-3.5 py-1.5 border border-border rounded-xl bg-slate-50 text-primary font-semibold focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors w-full xs:w-auto"
            >
              <option value="both">All (Singles & Doubles)</option>
              <option value="player">Individual Competitors Only</option>
              <option value="team">Pairs / Teams Only</option>
            </select>
          </div>
        </div>

        {/* =========================================================
            DIVIDED CATEGORY SECTIONS (When in Grouped View)
           ========================================================= */}
        {selectedCategory === "All" && viewMode === "grouped" ? (
          <div className="space-y-8 mb-12">
            {SPECIFIC_CATEGORIES.map((cat) => {
              const catRows = leaderboard
                .filter((r) => r.category === cat)
                .filter((r) => (entityType === "both" ? true : r.entity_type === entityType))
                .sort((a, b) => (b.total_tournament_points || 0) - (a.total_tournament_points || 0) || (b.matches_won || 0) - (a.matches_won || 0));

              if (catRows.length === 0) return null;

              return (
                <div key={cat} className="bg-white rounded-2xl border border-border shadow-card overflow-hidden">
                  <div className="px-5 py-3.5 bg-slate-50/80 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-accent"></span>
                      <h3 className="font-heading font-black text-primary text-sm uppercase tracking-wide">
                        {cat} Standings
                      </h3>
                      <span className="text-[11px] text-muted font-medium">({catRows.length} ranked)</span>
                    </div>
                    {catRows[0] && (
                      <div className="flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                        <Crown className="w-3 h-3 text-amber-600" />
                        <span>Leader: {catRows[0].entity_name} ({catRows[0].total_tournament_points} pts)</span>
                      </div>
                    )}
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50/40 border-b border-slate-100 text-secondary font-heading font-bold uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="py-2.5 px-4 w-14">Rank</th>
                          <th className="py-2.5 px-4">Participant / Team</th>
                          <th className="py-2.5 px-4 text-center">Played</th>
                          <th className="py-2.5 px-4 text-center">Wins</th>
                          <th className="py-2.5 px-4 text-center">Losses</th>
                          <th className="py-2.5 px-4 text-center">Rally Points</th>
                          <th className="py-2.5 px-4 text-center">Diff</th>
                          <th className="py-2.5 px-4 text-right">Tournament Pts</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {catRows.map((row, idx) => {
                          const diff = (row.points_scored || 0) - (row.points_conceded || 0);
                          const isTop = idx === 0;

                          return (
                            <tr
                              key={row.id || idx}
                              className={`transition-colors ${isTop ? "bg-amber-50/30 hover:bg-amber-50/50" : "hover:bg-slate-50/80"
                                }`}
                            >
                              <td className="py-3 px-4 font-bold text-primary">
                                {idx === 0 ? (
                                  <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 inline-flex items-center justify-center text-[11px] font-heading font-black shadow-xs">
                                    1
                                  </span>
                                ) : idx === 1 ? (
                                  <span className="w-5 h-5 rounded-full bg-slate-300 text-slate-900 inline-flex items-center justify-center text-[11px] font-heading font-black shadow-xs">
                                    2
                                  </span>
                                ) : idx === 2 ? (
                                  <span className="w-5 h-5 rounded-full bg-amber-700 text-white inline-flex items-center justify-center text-[11px] font-heading font-black shadow-xs">
                                    3
                                  </span>
                                ) : (
                                  <span className="text-muted ml-1.5 font-mono font-bold text-xs">{idx + 1}</span>
                                )}
                              </td>
                              <td className="py-3 px-4 font-heading font-bold text-primary text-sm flex items-center gap-2">
                                <span>{row.entity_name}</span>
                                {row.is_live && (
                                  <span className="inline-flex items-center gap-1 text-[9px] uppercase font-black text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded-full border border-rose-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                                    LIVE
                                  </span>
                                )}
                                {isTop && (
                                  <span className="text-[10px] uppercase font-black text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded border border-amber-300">
                                    👑 #1 Topper
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-center text-secondary">{row.matches_played}</td>
                              <td className="py-3 px-4 text-center font-bold text-accent">{row.matches_won}</td>
                              <td className="py-3 px-4 text-center text-secondary">{row.matches_lost}</td>
                              <td className="py-3 px-4 text-center font-mono text-secondary">
                                {row.points_scored} : {row.points_conceded}
                              </td>
                              <td
                                className={`py-3 px-4 text-center font-mono font-bold ${diff > 0 ? "text-accent" : diff < 0 ? "text-rose-600" : "text-secondary"
                                  }`}
                              >
                                {diff > 0 ? `+${diff}` : diff}
                              </td>
                              <td className="py-3 px-4 text-right font-mono font-black text-accent text-sm">
                                {row.total_tournament_points} pts
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card List View for Category Standings */}
                  <div className="md:hidden divide-y divide-border">
                    {catRows.map((row, idx) => {
                      const diff = (row.points_scored || 0) - (row.points_conceded || 0);
                      const isTop = idx === 0;

                      return (
                        <div
                          key={row.id || idx}
                          className={`p-3.5 flex items-center justify-between gap-3 ${isTop ? "bg-amber-50/40" : "bg-white"
                            }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="shrink-0">
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
                                <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 inline-flex items-center justify-center text-xs font-mono font-bold">
                                  {idx + 1}
                                </span>
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-heading font-bold text-xs sm:text-sm text-primary truncate">
                                  {row.entity_name}
                                </span>
                                {isTop && (
                                  <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                                    <Crown className="w-2.5 h-2.5 text-amber-600" /> #1
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted flex-wrap">
                                <span className="font-bold text-accent">{row.matches_won}W</span>
                                <span>-</span>
                                <span>{row.matches_lost}L</span>
                                <span>•</span>
                                <span className="font-mono text-slate-500">{row.points_scored}:{row.points_conceded}</span>
                                <span>•</span>
                                <span className={`font-mono font-bold ${diff > 0 ? "text-accent" : diff < 0 ? "text-rose-600" : "text-muted"}`}>
                                  {diff > 0 ? `+${diff}` : diff}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="font-mono font-black text-accent text-sm sm:text-base">
                              {row.total_tournament_points} pts
                            </div>
                            <span className="text-[10px] text-muted font-medium">
                              {row.matches_played} played
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* =========================================================
              STANDARD / FILTERED LEADERBOARD TABLE
             ========================================================= */
          <div className="bg-white rounded-2xl border border-border shadow-card overflow-hidden mb-12">
            {/* Desktop Table View (>= 768px) */}
            <div className="hidden md:block overflow-x-auto">
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
                    paginatedLeaderboard.map((row, idx) => {
                      const absoluteRank = startIndex + idx + 1;
                      const diff = (row.points_scored || 0) - (row.points_conceded || 0);
                      const isTopInCategory = (row.rank === 1 || row.category_rank === 1 || absoluteRank === 1);

                      return (
                        <tr
                          key={row.id || idx}
                          className={`transition-colors ${isTopInCategory && selectedCategory !== "All"
                              ? "bg-amber-50/20 hover:bg-amber-50/40"
                              : "hover:bg-slate-50/80"
                            }`}
                        >
                          <td className="py-4 px-4 font-bold text-primary">
                            {absoluteRank === 1 ? (
                              <span className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 inline-flex items-center justify-center text-xs font-heading font-black shadow-xs">
                                1
                              </span>
                            ) : absoluteRank === 2 ? (
                              <span className="w-6 h-6 rounded-full bg-slate-300 text-slate-900 inline-flex items-center justify-center text-xs font-heading font-black shadow-xs">
                                2
                              </span>
                            ) : absoluteRank === 3 ? (
                              <span className="w-6 h-6 rounded-full bg-amber-700 text-white inline-flex items-center justify-center text-xs font-heading font-black shadow-xs">
                                3
                              </span>
                            ) : (
                              <span className="text-muted ml-2 font-mono font-bold">#{absoluteRank}</span>
                            )}
                          </td>
                          <td className="py-4 px-4 font-heading font-bold text-primary text-sm">
                            <div className="flex items-center gap-2">
                              <span>{row.entity_name}</span>
                              {isTopInCategory && (
                                <span className="text-[10px] uppercase font-black text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded border border-amber-300 flex items-center gap-1">
                                  <Crown className="w-2.5 h-2.5 text-amber-600" /> Top in Division
                                </span>
                              )}
                            </div>
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
                            className={`py-4 px-4 text-center font-mono font-bold ${diff > 0 ? "text-accent" : diff < 0 ? "text-rose-600" : "text-secondary"
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

            {/* Mobile Card List View (< 768px) */}
            <div className="md:hidden divide-y divide-border">
              {filteredLeaderboard.length === 0 ? (
                <div className="py-14 text-center text-xs text-muted">
                  No leaderboard standings recorded for this category yet.
                </div>
              ) : (
                paginatedLeaderboard.map((row, idx) => {
                  const absoluteRank = startIndex + idx + 1;
                  const diff = (row.points_scored || 0) - (row.points_conceded || 0);
                  const isTopInCategory = (row.rank === 1 || row.category_rank === 1 || absoluteRank === 1);

                  return (
                    <div
                      key={row.id || idx}
                      className={`p-3.5 flex items-center justify-between gap-3 ${isTopInCategory && selectedCategory !== "All" ? "bg-amber-50/40" : "bg-white"
                        }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="shrink-0">
                          {absoluteRank === 1 ? (
                            <span className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 inline-flex items-center justify-center text-xs font-heading font-black shadow-xs">
                              1
                            </span>
                          ) : absoluteRank === 2 ? (
                            <span className="w-6 h-6 rounded-full bg-slate-300 text-slate-900 inline-flex items-center justify-center text-xs font-heading font-black shadow-xs">
                              2
                            </span>
                          ) : absoluteRank === 3 ? (
                            <span className="w-6 h-6 rounded-full bg-amber-700 text-white inline-flex items-center justify-center text-xs font-heading font-black shadow-xs">
                              3
                            </span>
                          ) : (
                            <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 inline-flex items-center justify-center text-xs font-mono font-bold">
                              {absoluteRank}
                            </span>
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-heading font-bold text-xs sm:text-sm text-primary truncate">
                              {row.entity_name}
                            </span>
                            {isTopInCategory && (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                                <Crown className="w-2.5 h-2.5 text-amber-600" /> #1
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-muted flex-wrap">
                            <span className="font-medium text-slate-700">{row.category}</span>
                            <span>•</span>
                            <span className="font-bold text-accent">{row.matches_won}W</span>
                            <span>-</span>
                            <span>{row.matches_lost}L</span>
                            <span>•</span>
                            <span className={`font-mono font-bold ${diff > 0 ? "text-accent" : diff < 0 ? "text-rose-600" : "text-muted"}`}>
                              {diff > 0 ? `+${diff}` : diff}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-mono font-black text-accent text-sm sm:text-base">
                          {row.total_tournament_points} pts
                        </div>
                        <span className="text-[10px] text-muted font-medium">
                          {row.matches_played} played
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pagination Controls */}
            {filteredLeaderboard.length > 0 && totalPages > 1 && (
              <div className="px-3.5 sm:px-5 py-3.5 border-t border-border bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-xs text-secondary">
                <div className="text-center sm:text-left text-[11px] sm:text-xs">
                  Showing <span className="font-bold text-primary">{startIndex + 1}</span> to{" "}
                  <span className="font-bold text-primary">{endIndex}</span> of{" "}
                  <span className="font-bold text-primary">{totalItems}</span> standings
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(1)}
                    disabled={safeCurrentPage <= 1}
                    className="p-1.5 rounded-lg border border-border bg-white text-primary hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    title="First Page"
                  >
                    <ChevronsLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={safeCurrentPage <= 1}
                    className="p-1.5 rounded-lg border border-border bg-white text-primary hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    title="Previous Page"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center gap-1 px-1">
                    {getPageNumbers().map((page, idx) =>
                      page === "..." ? (
                        <span key={`dots-${idx}`} className="px-1 text-muted text-xs select-none">
                          ...
                        </span>
                      ) : (
                        <button
                          key={page}
                          type="button"
                          onClick={() => setCurrentPage(page)}
                          className={`min-w-6 sm:min-w-7 h-6 sm:h-7 px-1.5 sm:px-2 rounded-lg text-xs font-semibold transition-all ${page === safeCurrentPage
                              ? "bg-primary text-white shadow-xs"
                              : "bg-white border border-border text-slate-700 hover:bg-slate-100"
                            }`}
                        >
                          {page}
                        </button>
                      )
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safeCurrentPage >= totalPages}
                    className="p-1.5 rounded-lg border border-border bg-white text-primary hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    title="Next Page"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={safeCurrentPage >= totalPages}
                    className="p-1.5 rounded-lg border border-border bg-white text-primary hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    title="Last Page"
                  >
                    <ChevronsRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

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
                    className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-primary truncate block sm:inline">{h.entity_name}</span>
                      <span className="text-secondary sm:ml-2 text-[11px] block sm:inline">{h.reason}</span>
                      {h.category && (
                        <span className="sm:ml-2 text-[10px] text-muted bg-slate-100 px-1.5 py-0.5 rounded inline-block mt-0.5 sm:mt-0">
                          {h.category}
                        </span>
                      )}
                    </div>
                    <span className="font-mono font-bold text-accent shrink-0 text-right">
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
