"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import PublicNavbar from "@/components/PublicNavbar";
import PublicFooter from "@/components/PublicFooter";
import LiveScoreboardCard from "@/components/LiveScoreboardCard";
import CourtVisualizer from "@/components/CourtVisualizer";
import BracketView from "@/components/BracketView";
import { useLiveMatches } from "@/lib/useLiveMatches";
import {
  Trophy,
  Activity,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  X,
  Sparkles,
  MapPin,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  ShieldCheck,
  Flame,
  Crown,
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

export default function HomePage() {
  const { matches, loading } = useLiveMatches();
  const [settings, setSettings] = useState(null);
  const [players, setPlayers] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [categoryLeaders, setCategoryLeaders] = useState({});
  const [selectedLiveMatch, setSelectedLiveMatch] = useState(null);
  const [leaderboardCategory, setLeaderboardCategory] = useState("All");

  // Leaderboard Pagination State
  const [lbPage, setLbPage] = useState(1);
  const lbPageSize = 8;

  const fetchLeaderboard = useCallback(() => {
    fetch("/api/points", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : {}))
      .then((data) => {
        const lb = data.leaderboard || [];
        setLeaderboard(lb);

        if (data.categoryLeaders && Object.keys(data.categoryLeaders).length > 0) {
          setCategoryLeaders(data.categoryLeaders);
        } else {
          const leaders = {};
          [
            "Men's Singles",
            "Women's Singles",
            "Men's Doubles",
            "Women's Doubles",
            "Mixed Doubles",
          ].forEach((cat) => {
            const catRecords = lb
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
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    // Fetch settings
    fetch("/api/settings", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : {}))
      .then((data) => setSettings(data.settings || null))
      .catch((err) => console.error(err));

    // Fetch players
    fetch("/api/players", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : {}))
      .then((data) => setPlayers(data.players || []))
      .catch((err) => console.error(err));

    // Initial Leaderboard fetch
    fetchLeaderboard();

    // Real-time listener: re-fetch leaderboard when points or match completes
    const handleSync = () => fetchLeaderboard();
    window.addEventListener("live_match_score_updated", handleSync);
    window.addEventListener("storage", (e) => {
      if (e.key === "badminton_live_score_sync") fetchLeaderboard();
    });

    // Background interval: poll every 4s for fresh standings
    const interval = setInterval(fetchLeaderboard, 4000);

    return () => {
      window.removeEventListener("live_match_score_updated", handleSync);
      clearInterval(interval);
    };
  }, [fetchLeaderboard]);

  // Reset pagination on category change
  useEffect(() => {
    setLbPage(1);
  }, [leaderboardCategory]);

  const liveMatches = (matches || []).filter((m) => m.status === "live" || m.status === "tied");
  const upcomingMatches = (matches || []).filter(
    (m) => m.status === "scheduled" || m.status === "ready"
  );
  const completedMatches = (matches || []).filter((m) => m.status === "completed");

  // Keep modal in sync with live matches
  const activeSelectedMatch = selectedLiveMatch
    ? matches.find((m) => String(m.id || m._id) === String(selectedLiveMatch.id || selectedLiveMatch._id)) || selectedLiveMatch
    : null;

  const filteredLeaderboard = (leaderboard || []).filter((item) => {
    if (leaderboardCategory === "All") return true;
    return item.category === leaderboardCategory;
  });

  // Pagination metrics for leaderboard preview
  const totalLbItems = filteredLeaderboard.length;
  const totalLbPages = Math.max(1, Math.ceil(totalLbItems / lbPageSize));
  const safeLbPage = Math.min(Math.max(1, lbPage), totalLbPages);
  const startLbIdx = (safeLbPage - 1) * lbPageSize;
  const endLbIdx = Math.min(startLbIdx + lbPageSize, totalLbItems);
  const paginatedLeaderboard = filteredLeaderboard.slice(startLbIdx, endLbIdx);

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-accent-light selection:text-accent">
      <PublicNavbar />

      <main className="flex-1 pb-24">
        {/* =========================================
            CLEAN ATHLETIC HERO SECTION (LIGHT THEME)
           ========================================= */}
        <section className="relative bg-gradient-to-b from-white via-slate-50 to-background border-b border-border overflow-hidden">
          {/* Subtle Olympic Badminton Court Line Watermark */}
          <div className="absolute inset-0 opacity-[0.035] pointer-events-none">
            <svg
              className="w-full h-full object-cover"
              viewBox="0 0 1200 600"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect x="100" y="50" width="1000" height="500" stroke="#0F172A" strokeWidth="2.5" />
              <line x1="600" y1="50" x2="600" y2="550" stroke="#0F172A" strokeWidth="3.5" />
              <line x1="450" y1="50" x2="450" y2="550" stroke="#0F172A" strokeWidth="2" strokeDasharray="6 6" />
              <line x1="750" y1="50" x2="750" y2="550" stroke="#0F172A" strokeWidth="2" strokeDasharray="6 6" />
              <line x1="100" y1="90" x2="1100" y2="90" stroke="#0F172A" strokeWidth="2" />
              <line x1="100" y1="510" x2="1100" y2="510" stroke="#0F172A" strokeWidth="2" />
              <line x1="100" y1="300" x2="1100" y2="300" stroke="#0F172A" strokeWidth="1.5" />
            </svg>
          </div>

          {/* Ambient luminous glows */}
          <div className="absolute -top-32 right-1/4 w-96 h-96 bg-accent-light rounded-full blur-3xl pointer-events-none opacity-60" />
          <div className="absolute -bottom-32 left-10 w-96 h-96 bg-amber-50 rounded-full blur-3xl pointer-events-none opacity-60" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-16 sm:pt-20 sm:pb-20">
            <div className="max-w-3xl">
              {/* Status Pill Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-white border border-border shadow-subtle text-secondary mb-6">
                {liveMatches.length > 0 ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
                    <span className="font-extrabold text-accent">LIVE NOW</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-primary font-semibold">
                      {liveMatches.length} Court{liveMatches.length === 1 ? "" : "s"} in Active Play
                    </span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-accent" />
                    <span className="font-bold text-accent">OFFICIAL TOURNAMENT HUB</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-secondary font-medium">11-Point Fast Rally Format</span>
                  </>
                )}
              </div>

              {/* Tournament Title */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-heading font-black tracking-tight leading-[1.1] text-primary">
                {settings?.name || "Apex Badminton Open 2026"}
              </h1>

              {/* Tagline */}
              <p className="mt-3 sm:mt-4 text-lg sm:text-2xl font-heading font-bold text-accent tracking-tight">
                Every Point. Every Rally. Every Victory.
              </p>

              {/* Description */}
              <p className="mt-2.5 sm:mt-3 text-xs sm:text-base text-secondary leading-relaxed max-w-2xl">
                {settings?.description ||
                  "Follow live court scoring, instantaneous umpire updates, official knockout brackets, and player leaderboards throughout the championship."}
              </p>

              {/* Tournament KPI Badges */}
              <div className="mt-6 sm:mt-8 flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-semibold text-secondary">
                <div className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-white border border-border shadow-subtle text-[11px] sm:text-xs">
                  <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent shrink-0" />
                  <span className="text-primary font-bold">{settings?.venue || "Grand Court Arena"}</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-white border border-border shadow-subtle text-[11px] sm:text-xs">
                  <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent shrink-0" />
                  <span>{settings?.number_of_courts || 4} Dedicated Courts</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-white border border-border shadow-subtle text-[11px] sm:text-xs">
                  <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent shrink-0" />
                  <span>Sudden-Death & Deuce Rules</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================
            LIVE MATCH SECTION (REAL-TIME COURTS)
           ========================================= */}
        <section id="live" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-3 border-b border-border">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-accent animate-ping" />
                <h2 className="text-xl sm:text-2xl font-heading font-black text-primary tracking-tight">
                  Live Court Action
                </h2>
              </div>
              <p className="text-xs text-secondary mt-1">
                Real-time scores synced with the official umpire console on court.
              </p>
            </div>

            {liveMatches.length > 0 && (
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold px-3 py-1 rounded-full bg-accent-light text-accent border border-accent-border self-start sm:self-auto">
                <span className="w-2 h-2 rounded-full bg-accent" />
                {liveMatches.length} MATCH{liveMatches.length === 1 ? "" : "ES"} IN PLAY
              </span>
            )}
          </div>

          {liveMatches.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-border p-12 text-center shadow-subtle">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-muted mx-auto flex items-center justify-center mb-3">
                <Activity className="w-6 h-6 text-slate-400" />
              </div>
              <h3 className="text-base font-heading font-bold text-primary">No Matches Currently On Court</h3>
              <p className="text-xs text-muted max-w-sm mx-auto mt-1">
                Live scoring feeds activate as soon as the umpire conducts the toss for the next fixture.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {liveMatches.map((match) => (
                <LiveScoreboardCard
                  key={match.id}
                  match={match}
                  onOpenDetail={(m) => setSelectedLiveMatch(m)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Modal: Live Court Details */}
        {activeSelectedMatch && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white rounded-2xl max-w-3xl w-full border border-border shadow-elevated overflow-hidden max-h-[92vh] flex flex-col">
              <div className="p-3.5 sm:p-4 border-b border-border flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
                  <h3 className="font-heading font-black text-primary text-xs sm:text-sm">
                    Court {activeSelectedMatch.court_number} • {activeSelectedMatch.category} ({activeSelectedMatch.round})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedLiveMatch(null)}
                  className="p-1.5 rounded-lg text-secondary hover:text-primary hover:bg-slate-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3.5 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6">
                <CourtVisualizer match={activeSelectedMatch} />

                {/* Score Summary Side-by-Side */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4 text-center">
                  <div className="p-3 sm:p-4 rounded-xl bg-slate-50 border border-border">
                    <p className="text-xs font-bold text-secondary mb-1 truncate">{activeSelectedMatch.team_a_name}</p>
                    <p className="text-3xl sm:text-4xl font-heading font-black text-primary">
                      {activeSelectedMatch.score_a}
                    </p>
                    {activeSelectedMatch.serving_team === "A" && (
                      <span className="inline-block mt-2 text-[9px] sm:text-[10px] font-bold bg-accent-light text-accent border border-accent-border px-2 py-0.5 rounded-full">
                        Serving ({activeSelectedMatch.service_court} box)
                      </span>
                    )}
                  </div>

                  <div className="p-3 sm:p-4 rounded-xl bg-slate-50 border border-border">
                    <p className="text-xs font-bold text-secondary mb-1 truncate">{activeSelectedMatch.team_b_name}</p>
                    <p className="text-3xl sm:text-4xl font-heading font-black text-primary">
                      {activeSelectedMatch.score_b}
                    </p>
                    {activeSelectedMatch.serving_team === "B" && (
                      <span className="inline-block mt-2 text-[9px] sm:text-[10px] font-bold bg-accent-light text-accent border border-accent-border px-2 py-0.5 rounded-full">
                        Serving ({activeSelectedMatch.service_court} box)
                      </span>
                    )}
                  </div>
                </div>

                {/* Event history log */}
                <div>
                  <h4 className="text-xs font-heading font-bold text-primary uppercase tracking-wider mb-2">
                    Recent Rally History
                  </h4>
                  <div className="border border-border rounded-xl divide-y divide-border overflow-hidden bg-white max-h-48 overflow-y-auto">
                    {(activeSelectedMatch.history || []).length === 0 ? (
                      <div className="p-3 text-xs text-muted text-center">No points logged yet.</div>
                    ) : (
                      activeSelectedMatch.history
                        .slice()
                        .reverse()
                        .map((evt, idx) => (
                          <div key={idx} className="p-2 sm:p-2.5 text-xs flex items-center justify-between">
                            <span className="font-medium text-slate-700 truncate pr-2">{evt.event}</span>
                            <span className="font-mono text-slate-500 font-semibold shrink-0">
                              {evt.scoreA} - {evt.scoreB}
                            </span>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================
            UPCOMING & COMPLETED MATCHES
           ========================================= */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Upcoming Schedule */}
            <div>
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-700" />
                  <h3 className="text-lg font-heading font-black text-primary">Scheduled Matches</h3>
                </div>
                <Link
                  href="/matches"
                  className="text-xs font-bold text-accent hover:text-accent-hover flex items-center gap-1 transition-colors"
                >
                  View All Schedule <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="space-y-3">
                {upcomingMatches.length === 0 ? (
                  <div className="p-8 rounded-2xl border border-dashed border-border bg-white text-center text-xs text-muted">
                    No upcoming fixtures scheduled.
                  </div>
                ) : (
                  upcomingMatches.slice(0, 3).map((m) => (
                    <div
                      key={m.id}
                      className="p-4 rounded-xl border border-border bg-white shadow-subtle hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-center justify-between text-xs text-muted mb-2 font-medium">
                        <span className="bg-slate-100 text-primary px-2 py-0.5 rounded text-[11px] font-bold">
                          Court {m.court_number}
                        </span>
                        <span>{m.category} • {m.round}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm font-bold text-primary pt-1">
                        <span className="truncate pr-2">{m.team_a_name}</span>
                        <span className="text-xs text-muted font-normal uppercase shrink-0 px-2">VS</span>
                        <span className="truncate pl-2 text-right">{m.team_b_name}</span>
                      </div>
                      {m.scheduled_time && (
                        <div className="mt-2 text-[11px] text-secondary font-medium flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>Scheduled: {m.scheduled_time}</span>
                        </div>
                      )}
                      {m.timer_enabled && m.timer_duration_seconds > 0 && (
                        <div className="mt-1.5 text-[11px] text-muted flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>
                            {m.timer_duration_seconds >= 60
                              ? `${Math.floor(m.timer_duration_seconds / 60)} min match duration limit`
                              : `${m.timer_duration_seconds} sec match duration limit`}
                          </span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Completed Match Results */}
            <div>
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-accent" />
                  <h3 className="text-lg font-heading font-black text-primary">Completed Results</h3>
                </div>
                <Link
                  href="/matches"
                  className="text-xs font-bold text-accent hover:text-accent-hover flex items-center gap-1 transition-colors"
                >
                  Full Results <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="space-y-3">
                {completedMatches.length === 0 ? (
                  <div className="p-8 rounded-2xl border border-dashed border-border bg-white text-center text-xs text-muted">
                    No completed match results recorded yet.
                  </div>
                ) : (
                  completedMatches.slice(0, 5).map((m) => {
                    const matchTime = formatMatchDateTime(m);
                    return (
                      <div
                        key={m.id}
                        className="p-4 rounded-xl border border-border bg-white shadow-subtle hover:border-slate-300 transition-colors"
                      >
                        <div className="flex items-center justify-between text-xs text-muted mb-2 font-medium">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-accent font-bold bg-accent-light px-2.5 py-0.5 rounded-full text-[11px] border border-accent-border">
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
                          <span>{m.category} • {m.round}</span>
                        </div>

                        <div className="flex items-center justify-between text-sm pt-1 gap-2">
                          <span className={`min-w-0 flex-1 truncate pr-1 ${m.winner_team === "A" ? "font-bold text-primary" : "text-muted"}`}>
                            {m.team_a_name}
                          </span>
                          <div className="font-heading font-black text-xs sm:text-base px-2.5 sm:px-3 py-0.5 rounded-lg bg-slate-100 text-primary shrink-0 tabular-nums border border-border">
                            {m.score_a} : {m.score_b}
                          </div>
                          <span className={`min-w-0 flex-1 truncate pl-1 text-right ${m.winner_team === "B" ? "font-bold text-primary" : "text-muted"}`}>
                            {m.team_b_name}
                          </span>
                        </div>

                        {/* Date, Time & Court info */}
                        {matchTime && (
                          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-muted">
                            <span className="font-semibold text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                              Court {m.court_number}
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
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </section>

        {/* =========================================
            KNOCKOUT BRACKET PREVIEW
           ========================================= */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
          <div className="border border-border rounded-2xl bg-white p-6 shadow-card">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
              <div>
                <h3 className="text-lg font-heading font-black text-primary">Knockout Progression Tree</h3>
                <p className="text-xs text-secondary">Single-elimination championship progression toward the Grand Final.</p>
              </div>
            </div>
            <BracketView matches={matches} />
          </div>
        </section>

        {/* =========================================
            LEADERBOARD PREVIEW (LIGHT THEME TABLE)
           ========================================= */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-2 border-b border-border">
            <div>
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <h3 className="text-xl font-heading font-black text-primary">Tournament Leaderboard</h3>
              </div>
              <p className="text-xs text-secondary mt-0.5">
                Official standings computed by match victories, rally differentials, and tournament points.
              </p>
            </div>

            {/* Category Filter Pills (All 5 Categories) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
              {[
                "All",
                "Men's Singles",
                "Women's Singles",
                "Men's Doubles",
                "Women's Doubles",
                "Mixed Doubles",
              ].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setLeaderboardCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                    leaderboardCategory === cat
                      ? "bg-accent text-white shadow-subtle"
                      : "bg-white border border-border text-secondary hover:text-primary hover:bg-slate-50"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Division Toppers Showcase Chips */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Crown className="w-4 h-4 text-amber-500" />
              <h4 className="text-xs font-heading font-bold text-primary uppercase tracking-wider">
                Category Toppers & Division Leaders
              </h4>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-3">
              {[
                "Men's Singles",
                "Women's Singles",
                "Men's Doubles",
                "Women's Doubles",
                "Mixed Doubles",
              ].map((cat) => {
                const info = categoryLeaders[cat];
                const leader = info?.leader;
                const isSelected = leaderboardCategory === cat;

                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setLeaderboardCategory(cat)}
                    className={`p-2.5 sm:p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between last:col-span-2 lg:last:col-span-1 ${
                      isSelected
                        ? "bg-amber-50/70 border-amber-400/80 shadow-subtle ring-1 ring-amber-400"
                        : "bg-white border-border hover:border-slate-300 hover:bg-slate-50 shadow-subtle"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider mb-1.5 gap-1">
                        <span className="text-muted truncate">{cat}</span>
                        <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-0.5 text-[9px] shrink-0">
                          <Crown className="w-2.5 h-2.5 text-amber-600" /> #1
                        </span>
                      </div>
                      <div className="font-heading font-black text-xs text-primary truncate">
                        {leader ? leader.entity_name : "Awaiting Result"}
                      </div>
                    </div>

                    <div className="mt-2 pt-1.5 border-t border-border/60 flex items-center justify-between text-[11px]">
                      <span className="text-muted text-[10px] sm:text-[11px]">
                        {leader ? `${leader.matches_won}W - ${leader.matches_lost}L` : "0 Played"}
                      </span>
                      <span className="font-mono font-bold text-teal-700 text-xs">
                        {leader ? `${leader.total_tournament_points} pts` : "0 pts"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-border shadow-card overflow-hidden">
            {/* Desktop Table View (>= 768px) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-border text-secondary font-heading font-black uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4">Rank</th>
                    <th className="py-3.5 px-4">Participant</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4 text-center">Played</th>
                    <th className="py-3.5 px-4 text-center">Wins</th>
                    <th className="py-3.5 px-4 text-center">Losses</th>
                    <th className="py-3.5 px-4 text-center">Rally Points</th>
                    <th className="py-3.5 px-4 text-right">Tournament Pts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredLeaderboard.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-muted">
                        No ranking entries found for this category yet.
                      </td>
                    </tr>
                  ) : (
                    paginatedLeaderboard.map((row, idx) => {
                      const absoluteRank = startLbIdx + idx + 1;
                      const isTopper = absoluteRank === 1;

                      return (
                        <tr
                          key={row.id || idx}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            isTopper ? "bg-amber-50/30" : ""
                          }`}
                        >
                          <td className="py-3.5 px-4 font-bold text-primary">
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
                              <span className="text-muted ml-2 font-mono font-bold">
                                {absoluteRank}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-primary">
                            <div className="flex items-center gap-1.5">
                              <span>{row.entity_name}</span>
                              {isTopper && (
                                <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                                  <Crown className="w-2.5 h-2.5 text-amber-600" /> #1 Topper
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-secondary">{row.category}</td>
                          <td className="py-3.5 px-4 text-center text-secondary">
                            {row.matches_played}
                          </td>
                          <td className="py-3.5 px-4 text-center font-bold text-teal-700">
                            {row.matches_won}
                          </td>
                          <td className="py-3.5 px-4 text-center text-muted">
                            {row.matches_lost}
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono text-secondary">
                            {row.points_scored} : {row.points_conceded}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-black text-accent text-sm">
                            {row.total_tournament_points} pts
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View (< 768px screens) */}
            <div className="md:hidden divide-y divide-border">
              {filteredLeaderboard.length === 0 ? (
                <div className="py-10 text-center text-xs text-muted">
                  No ranking entries found for this category yet.
                </div>
              ) : (
                paginatedLeaderboard.map((row, idx) => {
                  const absoluteRank = startLbIdx + idx + 1;
                  const isTopper = absoluteRank === 1;

                  return (
                    <div
                      key={row.id || idx}
                      className={`p-3.5 flex items-center justify-between gap-3 ${
                        isTopper ? "bg-amber-50/40" : "bg-white"
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
                            {isTopper && (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                                <Crown className="w-2.5 h-2.5 text-amber-600" /> #1
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted flex-wrap">
                            <span className="font-medium text-slate-700">{row.category}</span>
                            <span>•</span>
                            <span className="font-bold text-teal-700">{row.matches_won}W</span>
                            <span>-</span>
                            <span>{row.matches_lost}L</span>
                            <span>•</span>
                            <span className="font-mono text-slate-500">{row.points_scored}:{row.points_conceded}</span>
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
            {filteredLeaderboard.length > 0 && totalLbPages > 1 && (
              <div className="px-3.5 sm:px-4 py-3 border-t border-border bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-secondary">
                <div className="text-center sm:text-left text-[11px] sm:text-xs">
                  Showing <span className="font-bold text-primary">{startLbIdx + 1}</span> to{" "}
                  <span className="font-bold text-primary">{endLbIdx}</span> of{" "}
                  <span className="font-bold text-primary">{totalLbItems}</span> standings
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setLbPage(1)}
                    disabled={safeLbPage <= 1}
                    className="p-1.5 rounded-lg border border-border bg-white text-primary hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    title="First Page"
                  >
                    <ChevronsLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setLbPage((p) => Math.max(1, p - 1))}
                    disabled={safeLbPage <= 1}
                    className="p-1.5 rounded-lg border border-border bg-white text-primary hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    title="Previous Page"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>

                  <span className="px-2.5 font-semibold text-primary text-xs">
                    Page {safeLbPage} of {totalLbPages}
                  </span>

                  <button
                    type="button"
                    onClick={() => setLbPage((p) => Math.min(totalLbPages, p + 1))}
                    disabled={safeLbPage >= totalLbPages}
                    className="p-1.5 rounded-lg border border-border bg-white text-primary hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    title="Next Page"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setLbPage(totalLbPages)}
                    disabled={safeLbPage >= totalLbPages}
                    className="p-1.5 rounded-lg border border-border bg-white text-primary hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    title="Last Page"
                  >
                    <ChevronsRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            <div className="p-3 bg-slate-50/50 border-t border-border text-center">
              <Link
                href="/leaderboard"
                className="text-xs font-bold text-accent hover:text-accent-hover transition-colors inline-flex items-center gap-1"
              >
                <span>View Complete Tournament Standings & Match Differentials</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
