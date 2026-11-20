"use client";

import { useState, useEffect } from "react";
import {
  Trophy,
  Plus,
  History,
  ArrowUpDown,
  CheckCircle,
  AlertCircle,
  X,
  Sparkles,
  Crown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Layers,
  ListOrdered,
} from "lucide-react";

export default function AdminPointsPage() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [history, setHistory] = useState([]);
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [categoryLeaders, setCategoryLeaders] = useState({});
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [viewMode, setViewMode] = useState("by_category"); // "by_category" | "table"
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Manual Adjustment Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [adjEntityId, setAdjEntityId] = useState("");
  const [adjEntityType, setAdjEntityType] = useState("player");
  const [adjCategory, setAdjCategory] = useState("Men's Singles");
  const [adjDelta, setAdjDelta] = useState(1);
  const [adjReason, setAdjReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const categories = [
    "All",
    "Men's Singles",
    "Women's Singles",
    "Men's Doubles",
    "Women's Doubles",
    "Mixed Doubles",
  ];

  const specificCategories = [
    "Men's Singles",
    "Women's Singles",
    "Men's Doubles",
    "Women's Doubles",
    "Mixed Doubles",
  ];

  const fetchData = async () => {
    try {
      const [ptRes, pRes, tRes] = await Promise.allSettled([
        fetch("/api/points", { cache: "no-store" }).then((r) => (r.ok ? r.json() : {})),
        fetch("/api/players", { cache: "no-store" }).then((r) => (r.ok ? r.json() : {})),
        fetch("/api/teams", { cache: "no-store" }).then((r) => (r.ok ? r.json() : {})),
      ]);
      const ptData = ptRes.status === "fulfilled" ? ptRes.value || {} : {};
      const pData = pRes.status === "fulfilled" ? pRes.value || {} : {};
      const tData = tRes.status === "fulfilled" ? tRes.value || {} : {};

      const playerList = pData.players || (Array.isArray(pData) ? pData : []);
      const teamList = tData.teams || (Array.isArray(tData) ? tData : []);
      const lbList = ptData.leaderboard || (Array.isArray(ptData) ? ptData : []);

      setLeaderboard(lbList);
      setHistory(ptData.history || []);
      setPlayers(playerList);
      setTeams(teamList);

      if (ptData.categoryLeaders && Object.keys(ptData.categoryLeaders).length > 0) {
        setCategoryLeaders(ptData.categoryLeaders);
      } else {
        const leaders = {};
        specificCategories.forEach((cat) => {
          const catRecords = lbList
            .filter((r) => r.category === cat)
            .sort(
              (a, b) =>
                (b.total_tournament_points || 0) - (a.total_tournament_points || 0) ||
                (b.matches_won || 0) - (a.matches_won || 0)
            );
          leaders[cat] = {
            leader: catRecords[0] || null,
            totalParticipants: catRecords.length,
          };
        });
        setCategoryLeaders(leaders);
      }

      if (playerList.length > 0) {
        setAdjEntityId(playerList[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [categoryFilter, pageSize]);

  const filteredLeaderboard = leaderboard.filter((r) => {
    if (categoryFilter === "All") return true;
    return r.category === categoryFilter;
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

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!adjReason.trim()) {
      setError("Please provide an audit reason for this points adjustment.");
      return;
    }

    let entityName = "";
    if (adjEntityType === "player") {
      const pl = players.find((p) => p.id === adjEntityId);
      entityName = pl ? pl.full_name : adjEntityId;
    } else {
      const tm = teams.find((t) => t.id === adjEntityId);
      entityName = tm ? tm.name : adjEntityId;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityId: adjEntityId,
          entityType: adjEntityType,
          entityName,
          category: adjCategory,
          delta: Number(adjDelta),
          reason: adjReason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to adjust points.");

      setModalOpen(false);
      setAdjReason("");
      fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-black text-primary tracking-tight">
            Tournament Standings & Points
          </h1>
          <p className="text-xs text-muted mt-1">
            Manage cumulative tournament standings, issue traceable manual adjustments, and audit point logs.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-primary hover:bg-secondary text-white text-xs font-bold transition-colors shadow-subtle flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-teal-400" />
          Manual Point Adjustment
        </button>
      </div>

      {/* Category Toppers & Division Champions Showcase */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-500" />
            <h2 className="text-xs font-heading font-black text-primary uppercase tracking-wider">
              Category Leaders & Division Toppers
            </h2>
          </div>
          <span className="text-[11px] text-muted font-medium">Click category to filter table below</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {specificCategories.map((cat) => {
            const info = categoryLeaders[cat];
            const leader = info?.leader;
            const isSelected = categoryFilter === cat;

            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(categoryFilter === cat ? "All" : cat)}
                className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  isSelected
                    ? "bg-amber-50/80 border-amber-400 ring-1 ring-amber-400 shadow-subtle"
                    : "bg-white border-border hover:border-slate-300 shadow-subtle"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider mb-1.5">
                    <span className="text-muted truncate">{cat}</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-0.5 text-[9px]">
                      <Crown className="w-2.5 h-2.5 text-amber-600" /> #1 Topper
                    </span>
                  </div>
                  <div className="font-heading font-black text-xs text-primary truncate">
                    {leader ? leader.entity_name : "No Leader Yet"}
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-border/60 flex items-center justify-between text-[11px]">
                  <span className="text-muted">
                    {leader ? `${leader.matches_won}W - ${leader.matches_lost}L` : "0 Played"}
                  </span>
                  <span className="font-mono font-bold text-teal-700">
                    {leader ? `${leader.total_tournament_points} pts` : "0 pts"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter Tabs & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-border bg-white shadow-subtle">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                categoryFilter === cat
                  ? "bg-primary text-white shadow-subtle"
                  : "bg-white border border-border text-slate-700 hover:bg-slate-50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* View Mode Toggle */}
        <div className="inline-flex rounded-xl border border-border p-1 bg-slate-50 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setViewMode("by_category")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === "by_category"
                ? "bg-white text-primary shadow-xs border border-border"
                : "text-muted hover:text-primary"
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-teal-600" />
            <span>By Category</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === "table"
                ? "bg-white text-primary shadow-xs border border-border"
                : "text-muted hover:text-primary"
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5 text-slate-600" />
            <span>Overall Table</span>
          </button>
        </div>
      </div>

      {/* Standings View: Grouped By Category */}
      {viewMode === "by_category" && categoryFilter === "All" ? (
        <div className="space-y-6">
          {specificCategories.map((cat) => {
            const catRecords = leaderboard.filter((r) => r.category === cat);
            const leader = catRecords[0];

            return (
              <div
                key={cat}
                className="bg-white rounded-2xl border border-border shadow-subtle overflow-hidden"
              >
                <div className="p-4 border-b border-border bg-slate-50/70 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                    <h3 className="font-heading font-black text-primary text-sm">{cat}</h3>
                    <span className="text-[11px] text-muted">({catRecords.length} competitors)</span>
                  </div>
                  {leader && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                      <Crown className="w-3 h-3 text-amber-600" /> #1: {leader.entity_name} ({leader.total_tournament_points} pts)
                    </span>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-border text-slate-600 font-heading font-bold uppercase tracking-wider text-[11px] bg-slate-50/30">
                      <tr>
                        <th className="py-3 px-4">Rank</th>
                        <th className="py-3 px-4">Participant / Team</th>
                        <th className="py-3 px-4 text-center">Played</th>
                        <th className="py-3 px-4 text-center">Wins</th>
                        <th className="py-3 px-4 text-center">Losses</th>
                        <th className="py-3 px-4 text-center">Rally Points</th>
                        <th className="py-3 px-4 text-right">Tournament Points</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {catRecords.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-muted">
                            No competitors ranked in this category yet.
                          </td>
                        </tr>
                      ) : (
                        catRecords.map((r, idx) => (
                          <tr
                            key={r.id || idx}
                            className={`hover:bg-slate-50/70 transition-colors ${
                              idx === 0 ? "bg-amber-50/20" : ""
                            }`}
                          >
                            <td className="py-3.5 px-4 font-bold text-primary">
                              {idx === 0 ? (
                                <span className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 inline-flex items-center justify-center text-xs font-black">
                                  1
                                </span>
                              ) : (
                                <span className="text-muted ml-2 font-mono font-bold">#{idx + 1}</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-primary">
                              <div className="flex items-center gap-1.5">
                                <span>{r.entity_name}</span>
                                {idx === 0 && (
                                  <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                                    <Crown className="w-2.5 h-2.5 text-amber-600" /> #1 Topper
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-center text-muted">{r.matches_played}</td>
                            <td className="py-3.5 px-4 text-center font-bold text-teal-700">
                              {r.matches_won}
                            </td>
                            <td className="py-3.5 px-4 text-center text-muted">{r.matches_lost}</td>
                            <td className="py-3.5 px-4 text-center font-mono text-muted">
                              {r.points_scored} : {r.points_conceded}
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono font-bold text-teal-700 text-sm">
                              {r.total_tournament_points} pts
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Standings Table with Pagination */
        <div className="bg-white rounded-2xl border border-border shadow-subtle overflow-hidden">
          <div className="p-4 border-b border-border bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <h2 className="text-xs font-heading font-bold text-primary uppercase tracking-wider">
                Official Leaderboard Standings ({filteredLeaderboard.length} entries)
              </h2>
            </div>
            {categoryFilter !== "All" && (
              <span className="text-xs font-bold text-primary bg-white px-2.5 py-1 rounded-lg border border-border">
                {categoryFilter}
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border text-slate-600 font-heading font-bold uppercase tracking-wider text-[11px] bg-slate-50/50">
                <tr>
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Participant / Team</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-center">Played</th>
                  <th className="py-3 px-4 text-center">Wins</th>
                  <th className="py-3 px-4 text-center">Losses</th>
                  <th className="py-3 px-4 text-center">Rally Points (F : A)</th>
                  <th className="py-3 px-4 text-right">Tournament Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredLeaderboard.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted">
                      No points recorded yet for this category.
                    </td>
                  </tr>
                ) : (
                  paginatedLeaderboard.map((r, idx) => {
                    const absoluteRank = startIndex + idx + 1;
                    const isTopper = absoluteRank === 1;

                    return (
                      <tr
                        key={r.id || idx}
                        className={`hover:bg-slate-50/70 transition-colors ${
                          isTopper ? "bg-amber-50/20" : ""
                        }`}
                      >
                        <td className="py-3.5 px-4 font-bold text-primary">
                          {absoluteRank === 1 ? (
                            <span className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 inline-flex items-center justify-center text-xs font-black">
                              1
                            </span>
                          ) : absoluteRank === 2 ? (
                            <span className="w-6 h-6 rounded-full bg-slate-300 text-slate-900 inline-flex items-center justify-center text-xs font-black">
                              2
                            </span>
                          ) : absoluteRank === 3 ? (
                            <span className="w-6 h-6 rounded-full bg-amber-700 text-white inline-flex items-center justify-center text-xs font-black">
                              3
                            </span>
                          ) : (
                            <span className="text-muted ml-2 font-mono font-bold">
                              #{absoluteRank}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-primary">
                          <div className="flex items-center gap-1.5">
                            <span>{r.entity_name}</span>
                            {isTopper && (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                                <Crown className="w-2.5 h-2.5 text-amber-600" /> #1 Topper
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-muted">{r.category}</td>
                        <td className="py-3.5 px-4 text-center text-muted">{r.matches_played}</td>
                        <td className="py-3.5 px-4 text-center font-bold text-teal-700">
                          {r.matches_won}
                        </td>
                        <td className="py-3.5 px-4 text-center text-muted">{r.matches_lost}</td>
                        <td className="py-3.5 px-4 text-center font-mono text-muted">
                          {r.points_scored} : {r.points_conceded}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-teal-700 text-sm">
                          {r.total_tournament_points} pts
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {filteredLeaderboard.length > 0 && (
            <div className="px-4 py-3.5 border-t border-border bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-secondary">
              <div className="flex flex-wrap items-center gap-3">
                <span>
                  Showing <span className="font-bold text-primary">{startIndex + 1}</span> to{" "}
                  <span className="font-bold text-primary">{endIndex}</span> of{" "}
                  <span className="font-bold text-primary">{totalItems}</span> standings
                </span>
                <div className="flex items-center gap-1.5 pl-3 border-l border-border">
                  <span className="text-[11px] text-muted">Per page:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="py-1 px-2 border border-border rounded-lg bg-white text-xs font-semibold text-primary focus:outline-none"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
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
                      <span key={`dots-${idx}`} className="px-1.5 text-muted text-xs select-none">
                        ...
                      </span>
                    ) : (
                      <button
                        key={page}
                        type="button"
                        onClick={() => setCurrentPage(page)}
                        className={`min-w-7 h-7 px-2 rounded-lg text-xs font-semibold transition-all ${
                          page === safeCurrentPage
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

      {/* Traceable History Log */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <History className="w-4 h-4 text-primary" />
          <h2 className="text-xs font-heading font-bold text-primary uppercase tracking-wider">
            Traceable Points Adjustment History
          </h2>
        </div>

        <div className="bg-white rounded-2xl border border-border shadow-subtle divide-y divide-border max-h-80 overflow-y-auto">
          {history.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted">
              No manual adjustments logged in the tournament ledger.
            </div>
          ) : (
            history.map((h) => (
              <div key={h.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors">
                <div>
                  <div className="font-bold text-primary">{h.entity_name}</div>
                  <div className="text-[11px] text-muted mt-0.5">
                    Category: {h.category} • Reason: <span className="text-slate-800 font-semibold">{h.reason}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`font-mono font-bold text-sm ${h.points_delta >= 0 ? "text-teal-700" : "text-rose-600"}`}>
                    {h.points_delta >= 0 ? `+${h.points_delta}` : h.points_delta} pts
                  </span>
                  <div className="text-[10px] text-muted">By {h.adjusted_by}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Manual Adjustment Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full border border-border shadow-elevated overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-slate-50">
              <h3 className="font-heading font-bold text-primary text-sm">Manual Points Adjustment</h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-muted hover:text-primary hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="p-6 space-y-4 text-xs overflow-y-auto">
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block font-semibold text-primary uppercase tracking-wider mb-1">
                  Entity Type *
                </label>
                <select
                  value={adjEntityType}
                  onChange={(e) => {
                    const t = e.target.value;
                    setAdjEntityType(t);
                    if (t === "player" && players.length > 0) setAdjEntityId(players[0].id);
                    if (t === "team" && teams.length > 0) setAdjEntityId(teams[0].id);
                  }}
                  className="w-full px-3 py-2 border border-border rounded-xl bg-white text-primary focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                >
                  <option value="player">Individual Player</option>
                  <option value="team">Doubles Pair / Team</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-primary uppercase tracking-wider mb-1">
                  Select {adjEntityType === "player" ? "Player" : "Team"} *
                </label>
                <select
                  required
                  value={adjEntityId}
                  onChange={(e) => setAdjEntityId(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-xl bg-white text-primary focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                >
                  {adjEntityType === "player"
                    ? players.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.full_name} ({p.player_id})
                        </option>
                      ))
                    : teams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.category})
                        </option>
                      ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-primary uppercase tracking-wider mb-1">
                  Category *
                </label>
                <select
                  value={adjCategory}
                  onChange={(e) => setAdjCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-xl bg-white text-primary focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                >
                  <option value="Men's Singles">Men's Singles</option>
                  <option value="Women's Singles">Women's Singles</option>
                  <option value="Men's Doubles">Men's Doubles</option>
                  <option value="Women's Doubles">Women's Doubles</option>
                  <option value="Mixed Doubles">Mixed Doubles</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-primary uppercase tracking-wider mb-1">
                  Points Delta (e.g. +2 for bonus, -1 for penalty) *
                </label>
                <input
                  type="number"
                  step="1"
                  required
                  value={adjDelta}
                  onChange={(e) => setAdjDelta(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-xl bg-white text-primary focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-primary uppercase tracking-wider mb-1">
                  Adjustment Audit Reason *
                </label>
                <input
                  type="text"
                  required
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                  placeholder="e.g. Conduct penalty, Sweep dominance bonus"
                  className="w-full px-3 py-2 border border-border rounded-xl bg-white text-primary focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div className="pt-4 border-t border-border flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 font-semibold text-muted hover:text-primary transition-colors text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 font-bold rounded-xl bg-primary text-white hover:bg-secondary transition-colors text-xs disabled:opacity-50 shadow-subtle"
                >
                  {submitting ? "Applying..." : "Apply Adjustment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}