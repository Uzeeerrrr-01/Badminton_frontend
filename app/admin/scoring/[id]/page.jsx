"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CourtVisualizer from "@/components/CourtVisualizer";
import FaultsGuideModal from "@/components/FaultsGuideModal";
import TossModal from "@/components/TossModal";
import MatchTimer from "@/components/MatchTimer";
import { broadcastScoreUpdate } from "@/lib/liveScoreSync";
import {
  RotateCcw,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Eye,
  EyeOff,
  ArrowLeft,
  ArrowRight,
  Download,
  Trophy,
  Shuffle,
  Timer,
  Clock,
  Calendar,
  Flame,
} from "lucide-react";

const FAULT_REASONS = [
  "Shuttle landed OUT",
  "Shuttle failed to cross the net",
  "Player touched the net",
  "Double hit",
  "Carrying or holding the shuttle",
  "Shuttle touched player's body or clothes",
  "Player obstruction or distraction",
  "Service fault",
  "Other / Manual point",
];

function cleanPlayerName(name) {
  if (!name || typeof name !== "string") return name || "";
  return name.replace(/\b(\w+)\s+\1\b/gi, "$1").trim();
}

export default function MatchScoringConsole({ params }) {
  const router = useRouter();
  const matchId = params.id;

  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showFaultsGuide, setShowFaultsGuide] = useState(false);
  const [showCourtVisualizer, setShowCourtVisualizer] = useState(true);
  const [showTossModal, setShowTossModal] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);

  // Fault modal state
  const [pendingTeam, setPendingTeam] = useState(null);
  const [selectedFault, setSelectedFault] = useState("");

  const fetchMatch = async () => {
    try {
      const res = await fetch(`/api/matches/${matchId}`);
      if (!res.ok) throw new Error("Match not found");
      const data = await res.json();
      setMatch(data.match);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatch();
    // Poll every 10s for external state changes (timer expiry from another tab)
    const poll = setInterval(() => {
      fetch(`/api/matches/${matchId}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.match) setMatch(d.match);
        })
        .catch(() => {});
    }, 10000);
    return () => clearInterval(poll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId]);

  // Open fault modal
  const openFaultModal = (team) => {
    if (actionInProgress) return;
    if (!match || match.status !== "live") return;
    setSelectedFault("");
    setPendingTeam(team);
  };

  // Confirm point with fault reason
  const confirmPoint = async () => {
    if (!selectedFault || !pendingTeam) return;
    setActionInProgress(true);
    setError("");
    try {
      const res = await fetch(`/api/matches/${matchId}/score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ winningTeam: pendingTeam, faultReason: selectedFault }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Scoring failed.");
      setMatch(data.match);
      broadcastScoreUpdate(data.match);
      setPendingTeam(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionInProgress(false);
    }
  };

  const handleUndo = async () => {
    if (actionInProgress) return;
    setActionInProgress(true);
    setError("");
    try {
      const res = await fetch(`/api/matches/${matchId}/undo`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Undo failed.");
      setMatch(data.match);
      broadcastScoreUpdate(data.match);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionInProgress(false);
    }
  };

  const handleLet = async () => {
    if (actionInProgress) return;
    setActionInProgress(true);
    setError("");
    try {
      const res = await fetch(`/api/matches/${matchId}/let`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Let failed.");
      setMatch(data.match);
      broadcastScoreUpdate(data.match);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionInProgress(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (newStatus === "completed") {
      if (!confirm("Are you sure you want to end and complete this match?")) return;
    }
    try {
      const res = await fetch(`/api/matches/${matchId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Status update failed.");
      setMatch(data.match);
      broadcastScoreUpdate(data.match);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleTossConfirm = async (tossData) => {
    try {
      const res = await fetch(`/api/matches/${matchId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "live", toss: tossData }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start match.");
      setShowTossModal(false);
      setMatch(data.match);
      broadcastScoreUpdate(data.match);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center text-xs text-muted">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-ping"></span>
          <span>Loading official umpire scoring console...</span>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-border shadow-subtle max-w-lg mx-auto">
        <p className="text-sm font-semibold text-rose-600 mb-4">{error || "Match not found"}</p>
        <Link
          href="/admin/matches"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-secondary transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Return to Fixtures
        </Link>
      </div>
    );
  }

  const isLive = match.status === "live";
  const isTied = match.status === "tied";
  const isCompleted = match.status === "completed";
  const isScheduled = match.status === "scheduled" || match.status === "ready";

  // Winner determination
  const isWinnerA = match.winner_team === "A" || (match.score_a > match.score_b);
  const isWinnerB = match.winner_team === "B" || (match.score_b > match.score_a);

  // Helper: Format duration
  const getMatchDuration = () => {
    if (!match) return "-";
    if (match.started_at && match.completed_at) {
      const diffMs = Math.max(0, new Date(match.completed_at).getTime() - new Date(match.started_at).getTime());
      const mins = Math.floor(diffMs / 60000);
      const secs = Math.floor((diffMs % 60000) / 1000);
      return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    }
    if (match.timer_enabled && match.timer_duration_seconds > 0) {
      const rem = match.timer_remaining_seconds !== undefined && match.timer_remaining_seconds !== null
        ? match.timer_remaining_seconds
        : 0;
      const elapsed = Math.max(0, match.timer_duration_seconds - rem);
      const mins = Math.floor(elapsed / 60);
      const secs = elapsed % 60;
      return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    }
    return "-";
  };

  // Helper: Count faults
  const getFaultsCount = () => {
    if (!match || !match.history || match.history.length === 0) return "-";
    const faults = match.history.filter((h) => Boolean(h.faultReason));
    return faults.length > 0 ? faults.length : 0;
  };

  // Compute mapped timeline showing running score AFTER each point
  const rawHistory = match.history || [];
  let runningA = 0;
  let runningB = 0;

  const mappedTimeline = rawHistory.map((entry, index, arr) => {
    const wonA = entry.winningTeam === "A" || (entry.event && entry.event.includes("Team A"));
    const wonB = entry.winningTeam === "B" || (entry.event && entry.event.includes("Team B"));
    const team = wonB ? "B" : "A";
    const playerName = cleanPlayerName(wonB ? match.team_b_name : match.team_a_name);

    if (entry.prevScoreA !== undefined && entry.scoreA !== undefined) {
      // Modern scoringEngine snapshot with explicit post-point score
      runningA = entry.scoreA;
      runningB = entry.scoreB;
    } else {
      // Legacy or reconstructed progression
      if (wonA) runningA += 1;
      if (wonB) runningB += 1;
    }

    // Ensure the final rally row always equals the final match score
    if (index === arr.length - 1 && isCompleted) {
      runningA = match.score_a;
      runningB = match.score_b;
    }

    return {
      rallyNumber: index + 1,
      team,
      playerName,
      scoreAfter: `${runningA} - ${runningB}`,
      faultReason: entry.faultReason,
      event: entry.event || entry.description,
      timestamp: entry.timestamp,
    };
  });

  // Export CSV Handler
  const handleExportCSV = () => {
    if (!match || mappedTimeline.length === 0) return;
    const csvRows = [
      ["Rally", "Point Winner", "Team", "Score After Point", "Fault Reason / Details", "Timestamp"],
      ...mappedTimeline.map((item) => [
        item.rallyNumber,
        `"${item.playerName}"`,
        `"Team ${item.team}"`,
        `"${item.scoreAfter}"`,
        `"${(item.faultReason || item.event || "").replace(/"/g, '""')}"`,
        item.timestamp ? `"${new Date(item.timestamp).toISOString()}"` : '""',
      ]),
    ];
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map((r) => r.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `match-${match.id}-log.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // =========================================================================
  // RENDER COMPLETED MATCH VIEW (Match Result Screen)
  // =========================================================================
  if (isCompleted) {
    return (
      <div className="max-w-[1100px] mx-auto space-y-6">
        {/* 1. TOP BAR */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E9EEF3]">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <Link
              href="/admin/matches"
              className="inline-flex items-center gap-1.5 font-semibold text-slate-700 hover:text-slate-900 transition-colors"
              aria-label="Back to match schedule"
            >
              <ArrowLeft className="w-4 h-4 text-slate-500" />
              <span>Matches</span>
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-700">{match.round || "Fixture"}</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900 font-semibold">Court {match.court_number}</span>
          </div>

          {/* Secondary Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowFaultsGuide(true)}
              className="px-3 py-1.5 rounded-lg border border-[#E9EEF3] bg-white text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5 text-xs font-semibold shadow-xs"
            >
              <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
              <span>Faults rulebook</span>
            </button>
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-lg border border-[#E9EEF3] bg-white text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5 text-xs font-semibold shadow-xs"
              aria-label="Export match log as CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* 2. SCOREBOARD CARD */}
        <div className="bg-white rounded-[12px] border border-[#E9EEF3] shadow-xs overflow-hidden">
          {/* Header Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-6 py-4 border-b border-[#E9EEF3]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
                Court {match.court_number}
              </span>
              <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
                {match.category} - {match.round}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {match.completed_at && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                  <Calendar className="w-3 h-3 text-slate-500" />
                  <span>
                    {new Date(match.completed_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                  <span className="text-slate-300">•</span>
                  <Clock className="w-3 h-3 text-slate-500" />
                  <span>
                    {new Date(match.completed_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
                  </span>
                </span>
              )}
              {match.timer_enabled && match.timer_duration_seconds > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                  <Timer className="w-3 h-3 text-slate-500" />
                  <span>
                    {match.timer_duration_seconds >= 60
                      ? `${Math.floor(match.timer_duration_seconds / 60)}m timed`
                      : `${match.timer_duration_seconds}s timed`}
                  </span>
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Completed
              </span>
            </div>
          </div>

          {/* Center Row: 3-column grid on desktop, stacked on mobile */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-6 px-6 py-8">
            {/* Player A Column */}
            <div className={`flex flex-col items-center md:items-end text-center md:text-right ${isWinnerA ? "opacity-100" : "opacity-60"}`}>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Player A
              </span>
              <div className="flex items-center gap-2">
                {isWinnerA && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                    <Trophy className="w-3 h-3 text-teal-600" />
                    <span>Winner</span>
                  </span>
                )}
                <span className={`text-base sm:text-xl ${isWinnerA ? "font-bold text-slate-900" : "font-medium text-slate-600"}`}>
                  {cleanPlayerName(match.team_a_name)}
                </span>
              </div>
            </div>

            {/* Middle Monospace Score */}
            <div className="text-center px-4">
              <div className="text-4xl sm:text-5xl font-mono font-bold tracking-tight tabular-nums">
                <span className={isWinnerA ? "text-slate-900" : "text-slate-400"}>
                  {match.score_a}
                </span>
                <span className="text-slate-300 mx-3 font-sans font-light">-</span>
                <span className={isWinnerB ? "text-slate-900" : "text-slate-400"}>
                  {match.score_b}
                </span>
              </div>
            </div>

            {/* Player B Column */}
            <div className={`flex flex-col items-center md:items-start text-center md:text-left ${isWinnerB ? "opacity-100" : "opacity-60"}`}>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Player B
              </span>
              <div className="flex items-center gap-2">
                <span className={`text-base sm:text-xl ${isWinnerB ? "font-bold text-slate-900" : "font-medium text-slate-600"}`}>
                  {cleanPlayerName(match.team_b_name)}
                </span>
                {isWinnerB && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                    <Trophy className="w-3 h-3 text-teal-600" />
                    <span>Winner</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Footer Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-[#E9EEF3] bg-white">
            <span className="text-xs text-slate-500">
              {match.completion_reason === "SUDDEN_DEATH"
                ? "Won via Sudden Death (First Point)"
                : match.completion_reason === "TIME_EXPIRED_HIGHER_SCORE" || match.completion_reason === "TIMER_EXPIRY"
                ? "Won on timer expiry with a point advantage"
                : match.completion_reason === "NORMAL_SCORING"
                ? "Won on standard 11-point badminton rules"
                : match.score_a !== match.score_b
                ? "Won on timer expiry with a point advantage"
                : "Match concluded"}
            </span>
            <Link
              href="/admin/matches"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#101C2B] text-white text-xs font-semibold hover:bg-[#172033] transition-colors shadow-xs"
            >
              <span>Next fixture</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* 3. SUMMARY TILES (Grid of 2, stays 2 columns on mobile) */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
              Duration
            </div>
            <div className="text-[20px] font-medium text-slate-900">
              {getMatchDuration()}
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg p-4">
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
              Faults
            </div>
            <div className="text-[20px] font-medium text-slate-900">
              {getFaultsCount()}
            </div>
          </div>
        </div>

        {/* 4. RALLY TIMELINE CARD */}
        <div className="bg-white rounded-[12px] border border-[#E9EEF3] shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E9EEF3]">
            <h3 className="text-sm font-semibold text-slate-900">Rally timeline</h3>
            <span className="text-xs text-slate-500">Newest first</span>
          </div>

          {mappedTimeline.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No rallies recorded for this match.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="max-h-[460px] overflow-y-auto">
                <table className="w-full text-left border-collapse" role="table">
                  <thead>
                    <tr className="border-b border-[#E9EEF3] text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      <th className="py-2 px-3 w-16">#</th>
                      <th className="py-2 px-3">Point</th>
                      <th className="py-2 px-3 text-right">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E9EEF3] text-xs">
                    {[...mappedTimeline].reverse().map((item) => {
                      const isTeamB = item.team === "B";
                      return (
                        <tr key={item.rallyNumber} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-2.5 px-3 font-mono text-slate-400 text-xs">
                            {item.rallyNumber}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[11px] font-bold ${
                                  isTeamB
                                    ? "bg-teal-50 text-teal-700 border border-teal-200"
                                    : "bg-slate-100 text-slate-700 border border-slate-200"
                                }`}
                              >
                                Team {item.team}
                              </span>
                              <span className="font-medium text-slate-800">
                                {cleanPlayerName(item.playerName)}
                              </span>
                              {item.faultReason && (
                                <span className="text-[11px] text-slate-500 hidden sm:inline">
                                  · {item.faultReason}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 font-mono font-semibold text-slate-900 text-right tabular-nums">
                            {item.scoreAfter}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Faults Guide Modal */}
        {showFaultsGuide && (
          <FaultsGuideModal
            isOpen={showFaultsGuide}
            onClose={() => setShowFaultsGuide(false)}
          />
        )}
      </div>
    );
  }

  // =========================================================================
  // RENDER LIVE / SCHEDULED / TIED SCORING CONSOLE VIEW
  // =========================================================================
  const maxScore = Math.max(match.score_a, match.score_b);
  const minScore = Math.min(match.score_a, match.score_b);
  const isDeuce = match.score_a >= 10 && match.score_b >= 10;
  const isSuddenDeathNormal = match.score_a === 14 && match.score_b === 14;
  const isSuddenDeathTimer = match.timer_mode === "SUDDEN_DEATH" || Boolean(match.is_sudden_death);
  const isSuddenDeath = isSuddenDeathNormal || isSuddenDeathTimer;
  const isGamePoint =
    (!isDeuce && maxScore === 10) ||
    (isDeuce && !isSuddenDeath && maxScore >= 10 && maxScore - minScore === 1) ||
    isSuddenDeath;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Top Action Bar & Breadcrumb */}
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <Link
          href="/admin/matches"
          className="inline-flex items-center gap-1.5 font-semibold text-xs text-muted hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Match Schedule
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowCourtVisualizer(!showCourtVisualizer)}
            className="px-3 py-1.5 rounded-lg border border-border bg-white text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5 text-xs font-semibold shadow-subtle"
          >
            {showCourtVisualizer ? <EyeOff className="w-3.5 h-3.5 text-muted" /> : <Eye className="w-3.5 h-3.5 text-teal-600" />}
            {showCourtVisualizer ? "Hide Court 2D" : "Show Court 2D"}
          </button>
          <button
            type="button"
            onClick={() => setShowFaultsGuide(true)}
            className="px-3 py-1.5 rounded-lg border border-[#E9EEF3] bg-white text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5 text-xs font-semibold shadow-xs"
          >
            <HelpCircle className="w-3.5 h-3.5 text-slate-500" /> Faults Rulebook
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Status: Tied Alert */}
      {isTied && (
        <div className="p-5 rounded-2xl bg-amber-50 border-2 border-amber-400 shadow-card text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-200/60 text-amber-900 text-xs font-bold">
            <Timer className="w-3.5 h-3.5" />
            TIME EXPIRED · SCORES TIED
          </div>
          <div className="text-xl font-heading font-black text-amber-950">
            Equal Scores: {match.score_a} – {match.score_b}
          </div>
          <p className="text-xs text-amber-800 max-w-md mx-auto">
            The configured match timer reached 00:00 with no clear winner. Choose an official tournament tie-break resolution below:
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => handleStatusChange("live")}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors shadow-subtle"
            >
              Resume Match (Next Point Wins / Sudden Death)
            </button>
            <button
              type="button"
              onClick={() => handleStatusChange("completed")}
              className="px-4 py-2 rounded-xl bg-primary hover:bg-secondary text-white text-xs font-bold transition-colors shadow-subtle"
            >
              Declare Official Winner Manually
            </button>
          </div>
        </div>
      )}

      {/* Match Header Card */}
      <div className="rounded-2xl border border-border bg-white p-6 shadow-subtle">
        <div className="flex items-center justify-between pb-3 border-b border-border text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-primary px-2.5 py-0.5 rounded-md bg-slate-100 text-xs">
              Court {match.court_number}
            </span>
            <span className="font-semibold text-muted uppercase tracking-wider">
              {match.category} • {match.round}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isLive && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
                <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping"></span>
                LIVE
              </span>
            )}
            {match.timer_enabled && match.timer_duration_seconds > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                <Timer className="w-3 h-3 text-slate-500" />
                {match.timer_duration_seconds >= 60
                  ? `${Math.floor(match.timer_duration_seconds / 60)}m${match.timer_duration_seconds % 60 ? ` ${match.timer_duration_seconds % 60}s` : ""} Timed`
                  : `${match.timer_duration_seconds}s Timed`}
              </span>
            )}
          </div>
        </div>

        {/* Big Side-by-Side High-Contrast Score Arena */}
        <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-6 py-6">
          {/* Side A */}
          <div className={`p-5 rounded-2xl border text-center transition-all ${
            match.serving_team === "A" && isLive
              ? "border-teal-400 bg-teal-50/40 shadow-subtle"
              : "border-border bg-slate-50/50"
          }`}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted block mb-1">
              TEAM / PLAYER A
            </span>
            <h3 className="text-base sm:text-lg font-heading font-black text-primary truncate">
              {match.team_a_name}
            </h3>
            {match.serving_team === "A" && isLive && (
              <span className="inline-flex items-center gap-1 mt-2 px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[11px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
                Serving ({match.service_court || "right"} court)
              </span>
            )}
          </div>

          {/* Central High-Contrast Scoreboard */}
          <div className="text-center py-2">
            <div className="text-6xl sm:text-7xl font-heading font-black tracking-tight font-mono tabular-nums text-primary">
              <span className={match.score_a > match.score_b ? "text-primary" : "text-slate-400"}>
                {match.score_a}
              </span>
              <span className="text-slate-300 mx-2 font-sans font-light">:</span>
              <span className={match.score_b > match.score_a ? "text-primary" : "text-slate-400"}>
                {match.score_b}
              </span>
            </div>

            {isGamePoint && isLive && (
              <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                {isSuddenDeath ? "SUDDEN DEATH (Next Point Wins)" : isDeuce ? "DEUCE (2-pt lead required)" : "GAME POINT"}
              </div>
            )}
          </div>

          {/* Side B */}
          <div className={`p-5 rounded-2xl border text-center transition-all ${
            match.serving_team === "B" && isLive
              ? "border-teal-400 bg-teal-50/40 shadow-subtle"
              : "border-border bg-slate-50/50"
          }`}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted block mb-1">
              TEAM / PLAYER B
            </span>
            <h3 className="text-base sm:text-lg font-heading font-black text-primary truncate">
              {match.team_b_name}
            </h3>
            {match.serving_team === "B" && isLive && (
              <span className="inline-flex items-center gap-1 mt-2 px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[11px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
                Serving ({match.service_court || "right"} court)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Countdown Timer */}
      {isLive && match.timer_enabled && (
        <MatchTimer
          matchId={matchId}
          match={match}
          onMatchUpdate={(updated) => {
            setMatch(updated);
            broadcastScoreUpdate(updated);
          }}
        />
      )}

      {/* Sudden Death Notice */}
      {isLive && isSuddenDeathTimer && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-amber-500/20 border-2 border-amber-400 text-center space-y-1 animate-pulse">
          <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-rose-700">
            <Flame className="w-4 h-4 fill-rose-600 text-rose-600" />
            SUDDEN DEATH ACTIVE — NEXT POINT WINS!
          </div>
          <p className="text-xs text-amber-950 font-medium">
            Timer reached 00:00 with equal scores ({match.score_a}–{match.score_b}). Standard 11/15pt rules are suspended: the first team to score wins the match immediately.
          </p>
        </div>
      )}

      {/* Award Point Buttons */}
      {isLive && (
        <div className="rounded-2xl border border-border bg-white p-6 shadow-subtle space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-heading font-bold text-slate-700 uppercase tracking-wider">
              {isSuddenDeathTimer ? "Award Sudden-Death Winning Point" : "Score Point For"}
            </span>
            <span className="text-[11px] text-muted">
              Prompts fault reason before logging rally
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => openFaultModal("A")}
              disabled={actionInProgress}
              className={`py-6 px-4 rounded-2xl font-heading font-bold text-base shadow-card active:scale-[0.99] disabled:opacity-50 transition-all flex flex-col items-center justify-center gap-1 ${
                isSuddenDeathTimer
                  ? "bg-rose-600 hover:bg-rose-700 text-white ring-2 ring-rose-400/50"
                  : "bg-primary hover:bg-secondary text-white"
              }`}
            >
              <span className={`text-xs font-semibold uppercase tracking-wider ${isSuddenDeathTimer ? "text-amber-200 font-extrabold" : "text-teal-400"}`}>
                {isSuddenDeathTimer ? "⚡ Match-Winning Sudden Death Point" : "Award +1 Point"}
              </span>
              <span className="text-base sm:text-lg font-extrabold truncate max-w-full">
                {match.team_a_name}
              </span>
            </button>

            <button
              type="button"
              onClick={() => openFaultModal("B")}
              disabled={actionInProgress}
              className={`py-6 px-4 rounded-2xl font-heading font-bold text-base shadow-card active:scale-[0.99] disabled:opacity-50 transition-all flex flex-col items-center justify-center gap-1 ${
                isSuddenDeathTimer
                  ? "bg-rose-600 hover:bg-rose-700 text-white ring-2 ring-rose-400/50"
                  : "bg-primary hover:bg-secondary text-white"
              }`}
            >
              <span className={`text-xs font-semibold uppercase tracking-wider ${isSuddenDeathTimer ? "text-amber-200 font-extrabold" : "text-teal-400"}`}>
                {isSuddenDeathTimer ? "⚡ Match-Winning Sudden Death Point" : "Award +1 Point"}
              </span>
              <span className="text-base sm:text-lg font-extrabold truncate max-w-full">
                {match.team_b_name}
              </span>
            </button>
          </div>

          {/* Secondary Actions */}
          <div className="pt-2 border-t border-border flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleUndo}
              disabled={actionInProgress}
              className="flex-1 min-w-[120px] py-2.5 rounded-xl border border-border bg-white text-xs font-semibold text-slate-700 hover:text-primary hover:bg-slate-50 flex items-center justify-center gap-1.5 transition-colors shadow-subtle"
            >
              <RotateCcw className="w-3.5 h-3.5 text-muted" />
              Undo Last Rally
            </button>

            <button
              type="button"
              onClick={handleLet}
              disabled={actionInProgress}
              className="flex-1 min-w-[120px] py-2.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 text-xs font-semibold hover:bg-amber-100 flex items-center justify-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-700" />
              LET / Replay Point
            </button>

            <button
              type="button"
              onClick={() => handleStatusChange("completed")}
              disabled={actionInProgress}
              className="flex-1 min-w-[120px] py-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-xs font-semibold hover:bg-rose-100 flex items-center justify-center gap-1.5 transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-rose-600" />
              Conclude Match
            </button>
          </div>
        </div>
      )}

      {/* Start Match Prompt */}
      {isScheduled && (
        <div className="rounded-2xl border border-border bg-white p-8 text-center space-y-4 shadow-subtle">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-primary mx-auto flex items-center justify-center">
            <Shuffle className="w-6 h-6 text-slate-600" />
          </div>
          <div>
            <h3 className="text-base font-heading font-bold text-primary">Pre-Match Toss Required</h3>
            {match.timer_enabled && match.timer_duration_seconds > 0 ? (
              <p className="text-xs text-muted max-w-sm mx-auto mt-1">
                Match timer is set to <strong>{Math.floor(match.timer_duration_seconds / 60)}m {match.timer_duration_seconds % 60}s</strong>. Countdown initiates automatically as soon as the toss is recorded.
              </p>
            ) : (
              <p className="text-xs text-muted max-w-sm mx-auto mt-1">
                Standard match with no timer. 11-point rally scoring rules apply.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowTossModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-heading font-bold text-sm shadow-card transition-all"
          >
            <Shuffle className="w-4 h-4" /> Conduct Toss & Start Official Match
          </button>
        </div>
      )}

      {/* Court 2D Visualizer */}
      {showCourtVisualizer && isLive && (
        <div className="rounded-2xl border border-border bg-white p-5 shadow-subtle">
          <div className="text-xs font-heading font-bold text-slate-700 uppercase tracking-wider mb-3">
            Real-Time Court Player Positioning
          </div>
          <CourtVisualizer match={match} />
        </div>
      )}

      {/* Live Rally Progression Log */}
      {match.history && match.history.length > 0 && (
        <div className="rounded-2xl border border-border bg-white p-5 shadow-subtle">
          <div className="text-xs font-heading font-bold text-slate-700 uppercase tracking-wider mb-3">
            Official Rally Progression Log
          </div>
          <div className="space-y-1.5 max-h-52 overflow-y-auto divide-y divide-border/60">
            {[...mappedTimeline].reverse().map((h, i) => (
              <div key={i} className="pt-1.5 text-xs text-slate-600 flex items-center justify-between">
                <span className="font-medium">{h.event || `Rally ${h.rallyNumber}`}</span>
                <span className="font-mono font-bold text-primary tabular-nums">
                  {h.scoreAfter}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fault Modal */}
      {pendingTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full border border-border shadow-elevated p-6 space-y-4">
            <div>
              <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider block">
                Official Umpire Point Log
              </span>
              <h3 className="font-heading font-bold text-primary text-base mt-0.5">
                Rally Won By {pendingTeam === "A" ? match.team_a_name : match.team_b_name}
              </h3>
              <p className="text-xs text-muted mt-1">
                Select the fault reason that concluded this rally:
              </p>
            </div>

            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              {FAULT_REASONS.map((reason) => (
                <button
                  type="button"
                  key={reason}
                  onClick={() => setSelectedFault(reason)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl border text-xs transition-colors flex items-center justify-between ${
                    selectedFault === reason
                      ? "border-teal-500 bg-teal-50/80 text-teal-900 font-bold shadow-subtle"
                      : "border-border hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <span>{reason}</span>
                  {selectedFault === reason && (
                    <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setPendingTeam(null)}
                className="flex-1 py-2.5 border border-border rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmPoint}
                disabled={!selectedFault || actionInProgress}
                className="flex-1 py-2.5 bg-primary text-white rounded-xl text-xs font-bold disabled:opacity-50 hover:bg-secondary transition-colors shadow-subtle"
              >
                {actionInProgress ? "Recording Point..." : "Confirm & Award Point"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toss Modal */}
      {showTossModal && (
        <TossModal
          isOpen={showTossModal}
          onClose={() => setShowTossModal(false)}
          match={match}
          onConfirmStart={handleTossConfirm}
        />
      )}

      {/* Faults Guide */}
      {showFaultsGuide && (
        <FaultsGuideModal
          isOpen={showFaultsGuide}
          onClose={() => setShowFaultsGuide(false)}
        />
      )}
    </div>
  );
}
