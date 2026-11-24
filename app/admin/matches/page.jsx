"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Plus,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  Edit2,
  Trash2,
  ExternalLink,
  Shuffle,
  AlertCircle,
  X,
  Timer,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import ConfirmModal from "@/components/ConfirmModal";
import ToastNotification from "@/components/ToastNotification";
import TossModal from "@/components/TossModal";
import SearchablePlayerSelect from "@/components/SearchablePlayerSelect";
import { isDoublesCategory, ROUNDS, CATEGORIES } from "@/lib/scoringEngine";

export default function AdminMatchesPage() {
  const router = useRouter();
  const [matches, setMatches] = useState([]);
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter & Pagination
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  // Toss modal
  const [tossMatch, setTossMatch] = useState(null);

  // Create match modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "Confirm",
    variant: "danger",
    action: null,
  });
  const [confirmSubmitting, setConfirmSubmitting] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "info" });
  const [formData, setFormData] = useState({
    category: "Men's Singles",
    round: "Quarter-finals",
    court_number: 1,
    scheduled_time: "",
    participantA_id: "",
    participantB_id: "",
    next_match_id: "",
    next_match_slot: "A",
    timer_enabled: false,
    timer_minutes: 10,
    timer_seconds: 0,
  });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [mRes, pRes, tRes] = await Promise.allSettled([
        fetch("/api/matches", { cache: "no-store" }).then((r) => (r.ok ? r.json() : {})),
        fetch("/api/players", { cache: "no-store" }).then((r) => (r.ok ? r.json() : {})),
        fetch("/api/teams", { cache: "no-store" }).then((r) => (r.ok ? r.json() : {})),
      ]);
      const mData = mRes.status === "fulfilled" ? mRes.value || {} : {};
      const pData = pRes.status === "fulfilled" ? pRes.value || {} : {};
      const tData = tRes.status === "fulfilled" ? tRes.value || {} : {};

      setMatches(mData.matches || (Array.isArray(mData) ? mData : []));
      setPlayers(pData.players || (Array.isArray(pData) ? pData : []));
      setTeams(tData.teams || (Array.isArray(tData) ? tData : []));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    const msPlayers = players.filter((p) => p.gender === "Male");
    setFormData({
      category: "Men's Singles",
      round: "Quarter-finals",
      court_number: 1,
      scheduled_time: "",
      participantA_id: msPlayers[0]?.id || "",
      participantB_id: msPlayers[1]?.id || "",
      next_match_id: "",
      next_match_slot: "A",
      timer_enabled: false,
      timer_minutes: 10,
      timer_seconds: 0,
    });
    setFormError("");
    setCreateModalOpen(true);
  };

  const handleCategoryChange = (newCat) => {
    const isDoubles = isDoublesCategory(newCat);
    if (isDoubles) {
      const catTeams = teams.filter((t) => t.category === newCat);
      setFormData({
        ...formData,
        category: newCat,
        participantA_id: catTeams[0]?.id || "",
        participantB_id: catTeams[1]?.id || "",
      });
    } else {
      const isFemale = newCat.includes("Women's");
      const eligible = players.filter((p) => (isFemale ? p.gender === "Female" : p.gender === "Male"));
      setFormData({
        ...formData,
        category: newCat,
        participantA_id: eligible[0]?.id || "",
        participantB_id: eligible[1]?.id || "",
      });
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (formData.participantA_id === formData.participantB_id) {
      setFormError("Participant A and Participant B cannot be the same.");
      return;
    }

    const isDoubles = isDoublesCategory(formData.category);
    let teamAName = "";
    let teamBName = "";
    let p1A = null, p2A = null, p1B = null, p2B = null;

    if (isDoubles) {
      const tmA = teams.find((t) => t.id === formData.participantA_id);
      const tmB = teams.find((t) => t.id === formData.participantB_id);
      if (!tmA || !tmB) {
        setFormError("Selected teams not found.");
        return;
      }
      teamAName = tmA.name;
      teamBName = tmB.name;
      p1A = tmA.player1_id;
      p2A = tmA.player2_id;
      p1B = tmB.player1_id;
      p2B = tmB.player2_id;
    } else {
      const plA = players.find((p) => p.id === formData.participantA_id);
      const plB = players.find((p) => p.id === formData.participantB_id);
      if (!plA || !plB) {
        setFormError("Selected players not found.");
        return;
      }
      teamAName = plA.full_name;
      teamBName = plB.full_name;
      p1A = plA.id;
      p1B = plB.id;
    }

    setSubmitting(true);
    try {
      const payload = {
        category: formData.category,
        round: formData.round,
        court_number: Number(formData.court_number),
        scheduled_time: formData.scheduled_time || null,
        team_a_id: formData.participantA_id,
        team_a_name: teamAName,
        team_a_player1_id: p1A,
        team_a_player2_id: p2A,
        team_b_id: formData.participantB_id,
        team_b_name: teamBName,
        team_b_player1_id: p1B,
        team_b_player2_id: p2B,
        next_match_id: formData.next_match_id || null,
        next_match_slot: formData.next_match_slot || null,
        timer_enabled: formData.timer_enabled ? 1 : 0,
        timer_duration_seconds: formData.timer_enabled
          ? Number(formData.timer_minutes) * 60 + Number(formData.timer_seconds)
          : 0,
      };

      const res = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create match.");

      setCreateModalOpen(false);
      fetchData();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartWithToss = (match) => {
    setTossMatch(match);
  };

  const confirmStartToss = async (tossData) => {
    try {
      const res = await fetch(`/api/matches/${tossMatch.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "live",
          toss: tossData,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start match.");

      const startedId = tossMatch.id;
      setTossMatch(null);
      fetchData();
      router.push(`/admin/scoring/${startedId}`);
    } catch (err) {
      setToast({ message: err.message, type: "error" });
    }
  };

  const updateStatus = async (matchId, newStatus) => {
    try {
      const res = await fetch(`/api/matches/${matchId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to update match status.");
      }
      setToast({ message: `Match status updated to ${newStatus}.`, type: "success" });
      fetchData();
    } catch (err) {
      setToast({ message: err.message, type: "error" });
    }
  };

  const requestDeleteMatch = (match) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Match?",
      message: `Are you sure you want to delete Match #${match.match_number || ""} (${match.team_a_name} vs ${match.team_b_name})? Scheduled scores and results will be permanently removed.`,
      confirmText: "Delete Match",
      variant: "danger",
      action: async () => {
        setConfirmSubmitting(true);
        try {
          const res = await fetch(`/api/matches/${match.id}`, { method: "DELETE" });
          if (!res.ok) {
            const d = await res.json().catch(() => ({}));
            throw new Error(d.error || "Failed to delete match.");
          }
          setToast({ message: "Match deleted successfully.", type: "success" });
          setConfirmDialog({ isOpen: false, title: "", message: "", action: null });
          fetchData();
        } catch (err) {
          setToast({ message: err.message, type: "error" });
        } finally {
          setConfirmSubmitting(false);
        }
      },
    });
  };

  const requestEndMatch = (matchId) => {
    setConfirmDialog({
      isOpen: true,
      title: "End Match?",
      message: "Are you sure you want to end and complete this match now? Final scores will be locked and points will be officially awarded.",
      confirmText: "End Match",
      variant: "primary",
      action: async () => {
        setConfirmSubmitting(true);
        try {
          await updateStatus(matchId, "completed");
          setConfirmDialog({ isOpen: false, title: "", message: "", action: null });
        } catch (err) {
          setToast({ message: err.message, type: "error" });
        } finally {
          setConfirmSubmitting(false);
        }
      },
    });
  };

  const filteredMatches = matches.filter((m) => {
    if (statusFilter !== "all" && m.status !== statusFilter) return false;
    return true;
  });

  const totalItems = filteredMatches.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedMatches = filteredMatches.slice(startIndex, endIndex);

  const getPageNumbers = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (safeCurrentPage <= 4) return [1, 2, 3, 4, 5, "...", totalPages];
    if (safeCurrentPage >= totalPages - 3) return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, "...", safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1, "...", totalPages];
  };

  return (
    <>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-black text-primary tracking-tight">
            Match Management
          </h1>
          <p className="text-xs text-muted mt-1">
            Create tournament fixtures, schedule courts, configure custom timers, and initiate pre-match toss.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-primary hover:bg-secondary text-white text-xs font-bold transition-colors shadow-subtle flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-teal-400" />
          Schedule New Fixture
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-fit text-xs font-semibold text-slate-600">
        {["all", "live", "scheduled", "completed", "paused"].map((st) => (
          <button
            type="button"
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-lg capitalize transition-colors ${
              statusFilter === st
                ? "bg-white text-primary font-bold shadow-xs"
                : "hover:text-primary"
            }`}
          >
            {st} ({matches.filter((m) => (st === "all" ? true : m.status === st)).length})
          </button>
        ))}
      </div>

      {/* Matches List */}
      <div className="space-y-3">
        {filteredMatches.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-white text-muted text-sm shadow-subtle">
            No matches found for this status filter.
          </div>
        ) : (
          paginatedMatches.map((m) => {
            const isLive = m.status === "live";
            const isPaused = m.status === "paused";
            const isCompleted = m.status === "completed";
            const isScheduled = m.status === "scheduled" || m.status === "ready";
            const isTied = m.status === "tied";

            return (
              <div
                key={m.id}
                className={`p-5 rounded-2xl border bg-white shadow-subtle transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isLive
                    ? "border-teal-400 ring-2 ring-teal-500/10"
                    : isTied
                    ? "border-amber-400 ring-2 ring-amber-500/10"
                    : "border-border hover:border-slate-300"
                }`}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2 text-xs">
                    <span className="font-bold px-2 py-0.5 rounded-md bg-slate-100 text-primary text-[11px]">
                      Court {m.court_number}
                    </span>
                    <span className="font-semibold text-slate-700">{m.category}</span>
                    <span className="text-muted/60">•</span>
                    <span className="text-muted">{m.round}</span>

                    {m.timer_enabled && m.timer_duration_seconds > 0 && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                        <Timer className="w-3 h-3 text-slate-500" />
                        {m.timer_duration_seconds >= 60
                          ? `${Math.floor(m.timer_duration_seconds / 60)}m${m.timer_duration_seconds % 60 ? ` ${m.timer_duration_seconds % 60}s` : ""} timed`
                          : `${m.timer_duration_seconds}s timed`}
                      </span>
                    )}

                    {isLive && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200 animate-pulse">
                        LIVE ON COURT
                      </span>
                    )}
                    {isTied && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300 animate-pulse">
                        TIME EXPIRED · TIED
                      </span>
                    )}
                    {isPaused && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                        PAUSED
                      </span>
                    )}
                    {isCompleted && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        COMPLETED
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`text-base font-heading font-bold ${m.winner_team === "A" ? "text-teal-700" : "text-primary"}`}>
                      {m.team_a_name}
                    </span>
                    <span className="font-mono font-bold text-lg px-3 py-0.5 rounded-lg bg-slate-100 text-primary tabular-nums">
                      {m.score_a} : {m.score_b}
                    </span>
                    <span className={`text-base font-heading font-bold ${m.winner_team === "B" ? "text-teal-700" : "text-primary"}`}>
                      {m.team_b_name}
                    </span>
                  </div>

                  {m.winner_name && (
                    <div className="text-xs text-teal-700 font-semibold mt-1">
                      Winner: {m.winner_name}
                    </div>
                  )}

                  {(() => {
                    const ts = m.completed_at || m.started_at || m.scheduled_time || m.created_at;
                    if (!ts) return null;
                    const d = new Date(ts);
                    if (isNaN(d.getTime())) {
                      return m.scheduled_time ? (
                        <div className="text-[11px] text-muted flex items-center gap-1 mt-1 font-medium">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>Scheduled: {m.scheduled_time}</span>
                        </div>
                      ) : null;
                    }
                    const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                    const timeStr = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
                    return (
                      <div className="text-[11px] text-muted flex items-center gap-1.5 mt-1 font-medium">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{dateStr}</span>
                        <span className="text-slate-300">•</span>
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{timeStr}</span>
                        {isCompleted && <span className="text-slate-400 font-normal">(Concluded)</span>}
                      </div>
                    );
                  })()}
                </div>

                {/* Match Actions */}
                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  {isScheduled && (
                    <button
                      type="button"
                      onClick={() => handleStartWithToss(m)}
                      className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 transition-colors shadow-subtle flex items-center gap-1.5"
                    >
                      <Shuffle className="w-3.5 h-3.5" />
                      Conduct Toss & Start
                    </button>
                  )}

                  {(isLive || isTied) && (
                    <>
                      <Link
                        href={`/admin/scoring/${m.id}`}
                        className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 transition-colors shadow-subtle flex items-center gap-1.5"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        Scoring Terminal
                      </Link>
                      <button
                        type="button"
                        onClick={() => updateStatus(m.id, "paused")}
                        className="p-2 rounded-xl border border-border text-muted hover:text-amber-700 hover:bg-amber-50 transition-colors"
                        title="Pause Match"
                      >
                        <Pause className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => requestEndMatch(m.id)}
                        className="p-2 rounded-xl border border-border text-muted hover:text-teal-700 hover:bg-teal-50 transition-colors"
                        title="End Match"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    </>
                  )}

                  {isPaused && (
                    <>
                      <button
                        type="button"
                        onClick={() => updateStatus(m.id, "live")}
                        className="px-3.5 py-2 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 transition-colors"
                      >
                        Resume Match
                      </button>
                      <Link
                        href={`/admin/scoring/${m.id}`}
                        className="px-3.5 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-slate-50 transition-colors"
                      >
                        Scoring Console
                      </Link>
                    </>
                  )}

                  {isCompleted && (
                    <Link
                      href={`/admin/scoring/${m.id}`}
                      className="px-3.5 py-2 rounded-xl border border-border text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      View Event Log
                    </Link>
                  )}

                  <button
                    type="button"
                    onClick={() => requestDeleteMatch(m)}
                    className="p-2 text-muted hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                    title="Delete Match"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Footer */}
      {filteredMatches.length > 0 && totalPages > 1 && (
        <div className="p-4 rounded-2xl border border-border bg-white shadow-subtle flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-secondary">
          <div>
            Showing <span className="font-bold text-primary">{startIndex + 1}</span> to{" "}
            <span className="font-bold text-primary">{endIndex}</span> of{" "}
            <span className="font-bold text-primary">{totalItems}</span> fixtures
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCurrentPage(1)}
              disabled={safeCurrentPage <= 1}
              className="p-1.5 rounded-lg border border-border bg-white text-primary hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="First Page"
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safeCurrentPage <= 1}
              className="p-1.5 rounded-lg border border-border bg-white text-primary hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
                        : "bg-white border border-border text-slate-700 hover:bg-slate-50"
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
              className="p-1.5 rounded-lg border border-border bg-white text-primary hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Next Page"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage(totalPages)}
              disabled={safeCurrentPage >= totalPages}
              className="p-1.5 rounded-lg border border-border bg-white text-primary hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Last Page"
            >
              <ChevronsRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
      </div>

      {/* Toss Modal */}
      {tossMatch && (
        <TossModal
          isOpen={Boolean(tossMatch)}
          onClose={() => setTossMatch(null)}
          match={tossMatch}
          onConfirmStart={confirmStartToss}
        />
      )}

      {/* Create Match Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 !m-0 m-0 z-50 flex items-center justify-center p-4 bg-primary/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-border shadow-elevated overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-slate-50">
              <h3 className="font-heading font-bold text-primary text-sm">
                Schedule Tournament Fixture
              </h3>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="p-1 rounded-lg text-muted hover:text-primary hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 text-xs overflow-y-auto">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Category */}
              <div>
                <label className="block font-semibold text-primary uppercase tracking-wider mb-1">
                  Match Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-xl bg-white text-primary focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                >
                  <option value="Men's Singles">Men's Singles</option>
                  <option value="Women's Singles">Women's Singles</option>
                  <option value="Men's Doubles">Men's Doubles</option>
                  <option value="Women's Doubles">Women's Doubles</option>
                  <option value="Mixed Doubles">Mixed Doubles</option>
                </select>
              </div>

              {/* Tournament Round & Court */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-primary uppercase tracking-wider mb-1">
                    Round *
                  </label>
                  <select
                    value={formData.round}
                    onChange={(e) => setFormData({ ...formData, round: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-xl bg-white text-primary focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  >
                    {ROUNDS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-primary uppercase tracking-wider mb-1">
                    Court Number *
                  </label>
                  <select
                    value={formData.court_number}
                    onChange={(e) => setFormData({ ...formData, court_number: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-xl bg-white text-primary focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  >
                    {[1, 2, 3, 4, 5, 6].map((c) => (
                      <option key={c} value={c}>
                        Court {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Participants */}
              <div className="space-y-3 pt-3 border-t border-border">
                {isDoublesCategory(formData.category) ? (
                  <>
                    <div>
                      <label className="block font-semibold text-primary uppercase tracking-wider mb-1">
                        Team A *
                      </label>
                      <select
                        required
                        value={formData.participantA_id}
                        onChange={(e) => setFormData({ ...formData, participantA_id: e.target.value })}
                        className="w-full px-3 py-2 border border-border rounded-xl bg-white text-primary focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                      >
                        <option value="">Select Team A</option>
                        {teams
                          .filter((t) => t.category === formData.category)
                          .map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-primary uppercase tracking-wider mb-1">
                        Team B *
                      </label>
                      <select
                        required
                        value={formData.participantB_id}
                        onChange={(e) => setFormData({ ...formData, participantB_id: e.target.value })}
                        className="w-full px-3 py-2 border border-border rounded-xl bg-white text-primary focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                      >
                        <option value="">Select Team B</option>
                        {teams
                          .filter((t) => t.category === formData.category)
                          .map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </>
                ) : (
                  <>
                    <SearchablePlayerSelect
                      label="Player A"
                      required
                      value={formData.participantA_id}
                      onChange={(playerId) => setFormData({ ...formData, participantA_id: playerId })}
                      players={players.filter((p) =>
                        formData.category.includes("Women's")
                          ? p.gender === "Female"
                          : p.gender === "Male"
                      )}
                      placeholder="Search and select Player A..."
                    />

                    <SearchablePlayerSelect
                      label="Player B"
                      required
                      value={formData.participantB_id}
                      onChange={(playerId) => setFormData({ ...formData, participantB_id: playerId })}
                      players={players.filter((p) =>
                        formData.category.includes("Women's")
                          ? p.gender === "Female"
                          : p.gender === "Male"
                      )}
                      excludeId={formData.participantA_id}
                      placeholder="Search and select Player B..."
                    />
                  </>
                )}
              </div>

              {/* Knockout Progression Target */}
              <div className="pt-3 border-t border-border">
                <label className="block font-semibold text-primary uppercase tracking-wider mb-1">
                  Knockout Progression (Winner advances to match)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <select
                      value={formData.next_match_id}
                      onChange={(e) => setFormData({ ...formData, next_match_id: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-xl bg-white text-primary focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-xs"
                    >
                      <option value="">None (Final or standalone)</option>
                      {matches
                        .filter((m) => m.category === formData.category)
                        .map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.round} - Match #{m.match_number} ({m.team_a_name} vs {m.team_b_name})
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <select
                      value={formData.next_match_slot}
                      onChange={(e) => setFormData({ ...formData, next_match_slot: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-xl bg-white text-primary focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-xs"
                    >
                      <option value="A">Slot A</option>
                      <option value="B">Slot B</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Match Duration & Timer */}
              <div className="pt-3 border-t border-border space-y-3">
                <label className="block font-semibold text-primary uppercase tracking-wider">
                  Match Duration &amp; Timer
                </label>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-border">
                  <div>
                    <span className="font-semibold text-primary block">Enable Match Timer</span>
                    <span className="text-[11px] text-muted">Auto-countdown upon match toss</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, timer_enabled: !formData.timer_enabled })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      formData.timer_enabled ? "bg-teal-600" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.timer_enabled ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {formData.timer_enabled && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Minutes</label>
                      <input
                        type="number"
                        min="0"
                        max="120"
                        value={formData.timer_minutes}
                        onChange={(e) => setFormData({ ...formData, timer_minutes: e.target.value })}
                        className="w-full px-3 py-2 border border-border rounded-xl bg-white text-primary focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Seconds</label>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={formData.timer_seconds}
                        onChange={(e) => setFormData({ ...formData, timer_seconds: e.target.value })}
                        className="w-full px-3 py-2 border border-border rounded-xl bg-white text-primary focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                      />
                    </div>
                  </div>
                )}

                {formData.timer_enabled && (
                  <p className="text-[11px] text-muted">
                    Duration: <strong>{formData.timer_minutes}m {formData.timer_seconds}s</strong>. Timer starts automatically when you begin the match. Higher score wins if time expires before 11 points.
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-border flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 font-semibold text-muted hover:text-primary transition-colors text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 font-bold rounded-xl bg-primary text-white hover:bg-secondary transition-colors text-xs disabled:opacity-50 shadow-subtle"
                >
                  {submitting ? "Scheduling..." : "Create Match"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal (Replaces browser confirm) */}
      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        variant={confirmDialog.variant}
        submitting={confirmSubmitting}
        onConfirm={() => {
          if (confirmDialog.action) confirmDialog.action();
        }}
        onClose={() => setConfirmDialog({ isOpen: false, title: "", message: "", action: null })}
      />

      {/* Custom Toast Notification (Replaces browser alert) */}
      <ToastNotification
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "info" })}
      />
    </>
  );
}