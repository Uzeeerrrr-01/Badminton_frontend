"use client";

import { useState } from "react";
import PublicNavbar from "@/components/PublicNavbar";
import PublicFooter from "@/components/PublicFooter";
import LiveScoreboardCard from "@/components/LiveScoreboardCard";
import CourtVisualizer from "@/components/CourtVisualizer";
import { useLiveMatches } from "@/lib/useLiveMatches";
import { Activity, Clock, Calendar, CheckCircle2, Filter, X } from "lucide-react";

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
    if (statusFilter === "live" && m.status !== "live") return false;
    if (statusFilter === "upcoming" && m.status !== "scheduled" && m.status !== "ready") return false;
    if (statusFilter === "completed" && m.status !== "completed") return false;
    if (categoryFilter !== "all" && m.category !== categoryFilter) return false;
    return true;
  });

  const liveCount = (matches || []).filter((m) => m.status === "live").length;
  const upcomingCount = (matches || []).filter((m) => m.status === "scheduled" || m.status === "ready").length;
  const completedCount = (matches || []).filter((m) => m.status === "completed").length;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicNavbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">
            Tournament Matches
          </h1>
          <p className="text-sm text-muted mt-1">
            Browse live court games, scheduled fixtures, and completed match results.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-surface shadow-subtle mb-8">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === "all"
                  ? "bg-primary text-white font-semibold"
                  : "text-muted hover:text-primary hover:bg-slate-100"
              }`}
            >
              All Matches ({(matches || []).length})
            </button>
            <button
              onClick={() => setStatusFilter("live")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                statusFilter === "live"
                  ? "bg-emerald-600 text-white font-semibold"
                  : "text-muted hover:text-emerald-700 hover:bg-emerald-50"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              Live ({liveCount})
            </button>
            <button
              onClick={() => setStatusFilter("upcoming")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === "upcoming"
                  ? "bg-primary text-white font-semibold"
                  : "text-muted hover:text-primary hover:bg-slate-100"
              }`}
            >
              Upcoming ({upcomingCount})
            </button>
            <button
              onClick={() => setStatusFilter("completed")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === "completed"
                  ? "bg-primary text-white font-semibold"
                  : "text-muted hover:text-primary hover:bg-slate-100"
              }`}
            >
              Completed ({completedCount})
            </button>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-muted" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs px-3 py-1.5 border border-border rounded-lg bg-white text-primary focus:outline-none focus:ring-1 focus:ring-primary"
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
        <div className="space-y-6">
          {filteredMatches.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-surface text-muted text-sm">
              No matches found matching your filters.
            </div>
          ) : (
            filteredMatches.map((m) => {
              if (m.status === "live") {
                return (
                  <LiveScoreboardCard
                    key={m.id}
                    match={m}
                    onOpenDetail={(match) => setSelectedMatch(match)}
                  />
                );
              }

              const isCompleted = m.status === "completed";

              return (
                <div
                  key={m.id}
                  className="p-5 rounded-xl border border-border bg-surface shadow-subtle hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs text-muted mb-3 font-medium">
                    <div className="flex items-center gap-2">
                      <span className="bg-slate-100 text-primary px-2.5 py-0.5 rounded font-bold text-[11px]">
                        Court {m.court_number}
                      </span>
                      <span>{m.category}</span>
                      <span>•</span>
                      <span>{m.round}</span>
                    </div>

                    <div>
                      {isCompleted ? (
                        <span className="text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded text-[11px] border border-emerald-200">
                          Winner: {m.winner_name}
                        </span>
                      ) : (
                        <span className="capitalize text-slate-500 font-medium">
                          {m.status}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
                    <div className="md:col-span-4">
                      <p className={`text-base font-bold ${m.winner_team === "A" ? "text-emerald-800" : "text-primary"}`}>
                        {m.team_a_name}
                      </p>
                    </div>

                    <div className="md:col-span-3 text-center">
                      {isCompleted ? (
                        <div className="inline-block px-4 py-1 rounded-lg bg-slate-100 font-mono font-bold text-lg text-primary">
                          {m.score_a} : {m.score_b}
                        </div>
                      ) : (
                        <span className="text-xs font-semibold text-muted tracking-wider uppercase">
                          VS
                        </span>
                      )}
                    </div>

                    <div className="md:col-span-4 md:text-right">
                      <p className={`text-base font-bold ${m.winner_team === "B" ? "text-emerald-800" : "text-primary"}`}>
                        {m.team_b_name}
                      </p>
                    </div>
                  </div>

                  {/* Date, Time & Details Footer */}
                  {(() => {
                    const matchTime = formatMatchDateTime(m);
                    if (!matchTime) return null;
                    return (
                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-muted">
                        <span className="font-medium text-slate-500">
                          {isCompleted ? "Match Concluded" : m.scheduled_time ? "Scheduled Time" : "Match Time"}
                        </span>
                        <div className="flex items-center gap-1.5 font-medium text-slate-600">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{matchTime.dateStr}</span>
                          {matchTime.timeStr && (
                            <>
                              <span className="text-slate-300">•</span>
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>{matchTime.timeStr}</span>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              );
            })
          )}
        </div>

        {/* Modal: Court details */}
        {selectedMatch && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
            <div className="bg-surface rounded-2xl max-w-3xl w-full border border-border shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
              <div className="p-4 border-b border-border flex items-center justify-between bg-slate-50">
                <h3 className="font-bold text-primary text-sm">
                  Court {selectedMatch.court_number} • {selectedMatch.category}
                </h3>
                <button
                  onClick={() => setSelectedMatch(null)}
                  className="p-1 rounded-lg text-muted hover:text-primary hover:bg-slate-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto space-y-4">
                <CourtVisualizer match={selectedMatch} />
              </div>
            </div>
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
