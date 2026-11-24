"use client";

import { useState } from "react";
import PublicNavbar from "@/components/PublicNavbar";
import PublicFooter from "@/components/PublicFooter";
import LiveScoreboardCard from "@/components/LiveScoreboardCard";
import CourtVisualizer from "@/components/CourtVisualizer";
import BracketView from "@/components/BracketView";
import { useLiveMatches } from "@/lib/useLiveMatches";
import {
  Activity,
  Clock,
  Calendar,
  CheckCircle2,
  Filter,
  X,
  Trophy,
  ChevronRight,
  Flame,
} from "lucide-react";

function formatMatchDateTime(match) {
  const ts = match.completed_at || match.started_at || match.scheduled_time || match.updated_at || match.created_at;
  if (!ts) return null;
  try {
    const d = new Date(ts);
    if (isNaN(d.getTime())) {
      return { dateStr: "", timeStr: String(match.scheduled_time || "") };
    }
    const dateStr = d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const timeStr = d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return { dateStr, timeStr };
  } catch (_) {
    return null;
  }
}

export default function MatchesPage() {
  const { matches, loading } = useLiveMatches();
  const [viewMode, setViewMode] = useState("list"); // "list" | "bracket"
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedMatch, setSelectedMatch] = useState(null);

  const categories = [
    "Men's Singles",
    "Women's Singles",
    "Men's Doubles",
    "Women's Doubles",
    "Mixed Doubles",
  ];

  const filteredMatches = (matches || []).filter((m) => {
    if (statusFilter === "live" && m.status !== "live" && m.status !== "tied")
      return false;
    if (
      statusFilter === "upcoming" &&
      m.status !== "scheduled" &&
      m.status !== "ready"
    )
      return false;
    if (statusFilter === "completed" && m.status !== "completed") return false;
    if (categoryFilter !== "all" && m.category !== categoryFilter) return false;
    return true;
  });

  const liveCount = (matches || []).filter(
    (m) => m.status === "live" || m.status === "tied",
  ).length;
  const upcomingCount = (matches || []).filter(
    (m) => m.status === "scheduled" || m.status === "ready",
  ).length;
  const completedCount = (matches || []).filter(
    (m) => m.status === "completed",
  ).length;

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-accent-light selection:text-accent">
      <PublicNavbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 w-full overflow-x-hidden">
        {/* Header Banner */}
        <div className="mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-accent-light text-accent border border-accent-border mb-3">
            <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
            <span>CHAMPIONSHIP SCHEDULE & LIVE FEEDS</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-heading font-black text-primary tracking-tight">
            Tournament Matches & Fixtures
          </h1>
          <p className="text-xs sm:text-sm text-secondary mt-1 max-w-2xl">
            Live court scoring synced directly with the umpire console, upcoming match schedules, and official results.
          </p>
        </div>

        {/* View Mode Switcher (Schedule vs Knockout Bracket) */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-border">
            <button
              onClick={() => setViewMode("list")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === "list"
                  ? "bg-white text-primary shadow-xs font-black"
                  : "text-secondary hover:text-primary"
              }`}
            >
              Fixtures & Schedules
            </button>
            <button
              onClick={() => setViewMode("bracket")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === "bracket"
                  ? "bg-white text-primary shadow-xs font-black"
                  : "text-secondary hover:text-primary"
              }`}
            >
              Knockout Bracket
            </button>
          </div>
        </div>

        {viewMode === "bracket" ? (
          <div className="p-6 rounded-2xl border border-border bg-white shadow-subtle mb-8">
            <BracketView matches={matches} initialCategory={categoryFilter !== "all" ? categoryFilter : "Men's Singles"} />
          </div>
        ) : (
          <>
            {/* Filter Controls Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-3.5 rounded-2xl border border-border bg-white shadow-subtle mb-6 sm:mb-8">
              {/* Status Tabs: 2x2 Grid on mobile, inline on desktop (Zero Side-Scrolling!) */}
              <div className="grid grid-cols-2 md:flex md:items-center gap-1.5 w-full md:w-auto">
                <button
                  onClick={() => setStatusFilter("all")}
                  className={`px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold transition-all text-center ${
                    statusFilter === "all"
                      ? "bg-primary text-white shadow-subtle"
                      : "text-secondary hover:text-primary hover:bg-slate-50 border border-border/60 md:border-transparent"
                  }`}
                >
                  All Matches ({(matches || []).length})
                </button>
                <button
                  onClick={() => setStatusFilter("live")}
                  className={`px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 text-center ${
                    statusFilter === "live"
                      ? "bg-accent text-white shadow-emerald"
                      : "text-secondary hover:text-accent hover:bg-accent-light/50 border border-border/60 md:border-transparent"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${statusFilter === "live" ? "bg-white" : "bg-accent"} animate-pulse`} />
                  Live ({liveCount})
                </button>
                <button
                  onClick={() => setStatusFilter("upcoming")}
                  className={`px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold transition-all text-center ${
                    statusFilter === "upcoming"
                      ? "bg-primary text-white shadow-subtle"
                      : "text-secondary hover:text-primary hover:bg-slate-50 border border-border/60 md:border-transparent"
                  }`}
                >
                  Upcoming ({upcomingCount})
                </button>
                <button
                  onClick={() => setStatusFilter("completed")}
                  className={`px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold transition-all text-center ${
                    statusFilter === "completed"
                      ? "bg-primary text-white shadow-subtle"
                      : "text-secondary hover:text-primary hover:bg-slate-50 border border-border/60 md:border-transparent"
                  }`}
                >
                  Completed ({completedCount})
                </button>
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-2 w-full md:w-auto">
                <Filter className="w-3.5 h-3.5 text-secondary shrink-0" />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="text-xs px-3 py-2 border border-border rounded-xl bg-slate-50 text-primary font-semibold focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors w-full md:w-auto cursor-pointer"
                >
                  <option value="all">All Categories</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Matches Grid */}
            <div className="space-y-4 sm:space-y-6">
              {filteredMatches.length === 0 ? (
                <div className="p-10 sm:p-16 text-center rounded-2xl border border-dashed border-border bg-white shadow-subtle">
                  <div className="w-12 h-12 rounded-full bg-slate-100 mx-auto flex items-center justify-center mb-3">
                    <Clock className="w-6 h-6 text-slate-400" />
                  </div>
                  <h3 className="font-heading font-black text-primary text-base">No Matches Found</h3>
                  <p className="text-xs text-muted max-w-sm mx-auto mt-1">
                    There are currently no matches matching the selected filters.
                  </p>
                </div>
              ) : (
                filteredMatches.map((m) => {
                  if (m.status === "live" || m.status === "tied") {
                    return (
                      <LiveScoreboardCard
                        key={m.id}
                        match={m}
                        onOpenDetail={(match) => setSelectedMatch(match)}
                      />
                    );
                  }

                  const isCompleted = m.status === "completed";
                  const matchTime = formatMatchDateTime(m);

                  return (
                    <div
                      key={m.id}
                      className="p-4 sm:p-6 rounded-2xl border border-border bg-white shadow-card hover:shadow-elevated hover:border-slate-300 transition-all"
                    >
                      <div className="flex flex-wrap items-center justify-between text-xs text-muted mb-3 sm:mb-4 gap-2 font-medium">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          <span className="bg-slate-100 text-primary px-2.5 sm:px-3 py-0.5 rounded-md font-bold text-[11px] sm:text-xs border border-slate-200">
                            Court {m.court_number}
                          </span>
                          <span className="text-primary font-bold text-[11px] sm:text-xs">{m.category}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-[11px] sm:text-xs">{m.round}</span>
                        </div>

                        <div>
                          {isCompleted ? (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-accent font-bold bg-accent-light px-2.5 sm:px-3 py-0.5 rounded-full text-[11px] sm:text-xs border border-accent-border">
                                Winner: {m.winner_name}
                              </span>
                              {m.completion_reason === "SUDDEN_DEATH" && (
                                <span className="text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded-full text-[10px] border border-amber-border">
                                  ⚡ Sudden Death
                                </span>
                              )}
                              {m.completion_reason === "TIME_EXPIRED_HIGHER_SCORE" && (
                                <span className="text-secondary font-medium bg-slate-100 px-2 py-0.5 rounded-full text-[10px]">
                                  ⏱ Time Expired
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="capitalize font-bold text-slate-600 bg-slate-50 px-2.5 py-0.5 rounded border border-border text-[11px]">
                              {m.status}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-11 gap-3 sm:gap-4 items-center">
                        <div className="md:col-span-4 flex md:block items-center justify-between">
                          <div className="min-w-0 pr-2">
                            <p
                              className={`text-base sm:text-lg font-heading font-black truncate ${
                                m.winner_team === "A" ? "text-accent" : "text-primary"
                              }`}
                            >
                              {m.team_a_name}
                            </p>
                            {m.team_a_player1?.full_name && (
                              <p className="text-xs text-secondary mt-0.5 truncate">
                                {m.team_a_player1?.full_name}
                              </p>
                            )}
                          </div>
                          {isCompleted && (
                            <span className="md:hidden font-mono font-black text-xl text-primary shrink-0 px-2.5 py-0.5 rounded-lg bg-slate-100 border border-border">
                              {m.score_a}
                            </span>
                          )}
                        </div>

                        <div className="hidden md:block md:col-span-3 text-center">
                          {isCompleted ? (
                            <div className="inline-block px-5 py-1.5 rounded-xl bg-slate-100 font-mono font-black text-xl text-primary tabular-nums border border-border">
                              {m.score_a} : {m.score_b}
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider">
                              VS
                            </div>
                          )}
                        </div>

                        <div className="md:col-span-4 md:text-right flex md:block items-center justify-between">
                          <div className="min-w-0 pr-2 md:pr-0">
                            <p
                              className={`text-base sm:text-lg font-heading font-black truncate ${
                                m.winner_team === "B" ? "text-accent" : "text-primary"
                              }`}
                            >
                              {m.team_b_name}
                            </p>
                            {m.team_b_player1?.full_name && (
                              <p className="text-xs text-secondary mt-0.5 truncate">
                                {m.team_b_player1?.full_name}
                              </p>
                            )}
                          </div>
                          {isCompleted && (
                            <span className="md:hidden font-mono font-black text-xl text-primary shrink-0 px-2.5 py-0.5 rounded-lg bg-slate-100 border border-border">
                              {m.score_b}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Date, Time & Details Footer */}
                      {matchTime && (
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-muted">
                          <span className="font-semibold text-slate-600">
                            {isCompleted
                              ? "Match Concluded"
                              : m.scheduled_time
                              ? "Scheduled Time"
                              : "Fixture Time"}
                          </span>
                          <div className="flex items-center gap-2 font-medium text-slate-700">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{matchTime.dateStr}</span>
                            {matchTime.timeStr && (
                              <>
                                <span className="text-slate-300">•</span>
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                <span>{matchTime.timeStr}</span>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* Modal: Court Details */}
        {selectedMatch && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-3xl w-full border border-border shadow-elevated overflow-hidden max-h-[92vh] flex flex-col">
              <div className="p-3.5 sm:p-4 border-b border-border flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
                  <h3 className="font-heading font-black text-primary text-xs sm:text-sm">
                    Court {selectedMatch.court_number} • {selectedMatch.category} ({selectedMatch.round})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedMatch(null)}
                  className="p-1.5 rounded-lg text-secondary hover:text-primary hover:bg-slate-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3.5 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6">
                <CourtVisualizer match={selectedMatch} />

                {/* Score Summary Side-by-Side */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4 text-center">
                  <div className="p-3 sm:p-4 rounded-xl bg-slate-50 border border-border">
                    <p className="text-xs font-bold text-secondary mb-1 truncate">{selectedMatch.team_a_name}</p>
                    <p className="text-3xl sm:text-4xl font-heading font-black text-primary">
                      {selectedMatch.score_a}
                    </p>
                    {selectedMatch.serving_team === "A" && (
                      <span className="inline-block mt-2 text-[9px] sm:text-[10px] font-bold bg-accent-light text-accent border border-accent-border px-2 py-0.5 rounded-full">
                        Serving ({selectedMatch.service_court} box)
                      </span>
                    )}
                  </div>

                  <div className="p-3 sm:p-4 rounded-xl bg-slate-50 border border-border">
                    <p className="text-xs font-bold text-secondary mb-1 truncate">{selectedMatch.team_b_name}</p>
                    <p className="text-3xl sm:text-4xl font-heading font-black text-primary">
                      {selectedMatch.score_b}
                    </p>
                    {selectedMatch.serving_team === "B" && (
                      <span className="inline-block mt-2 text-[9px] sm:text-[10px] font-bold bg-accent-light text-accent border border-accent-border px-2 py-0.5 rounded-full">
                        Serving ({selectedMatch.service_court} box)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
