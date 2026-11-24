"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Layers,
  Trophy,
  Play,
  RotateCcw,
  Sparkles,
  Shuffle,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  Check,
  ChevronRight,
  ShieldCheck,
  ExternalLink,
  Award,
  ArrowRight,
  Flame,
  Info,
  Filter,
  X,
  HelpCircle,
} from "lucide-react";

const CATEGORIES = [
  "Men's Singles",
  "Women's Singles",
  "Men's Doubles",
  "Women's Doubles",
  "Mixed Doubles",
];

export default function AdminRoundsPage() {
  const [selectedCategory, setSelectedCategory] = useState("Men's Singles");
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Standings round filter
  const [standingsRoundFilter, setStandingsRoundFilter] = useState("all");
  const [filteredStandings, setFilteredStandings] = useState([]);
  const [standingsLoading, setStandingsLoading] = useState(false);

  // Active section tab
  const [activeTab, setActiveTab] = useState("rounds"); // "rounds" | "standings" | "bracket" | "teams"

  // Preview / Publish Modal
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [publishSubmitting, setPublishSubmitting] = useState(false);

  // Reset confirmation modal
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [roundToReset, setRoundToReset] = useState(null);
  const [resetSubmitting, setResetSubmitting] = useState(false);

  // Fetch Category Overview
  const fetchOverview = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/rounds/category/${encodeURIComponent(selectedCategory)}/overview`,
        { cache: "no-store", credentials: "include" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load category overview.");
      setOverview(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  // Fetch standings when category or round filter changes
  useEffect(() => {
    const fetchStandings = async () => {
      setStandingsLoading(true);
      try {
        const query = standingsRoundFilter !== "all" ? `?roundNumber=${standingsRoundFilter}` : "";
        const res = await fetch(
          `/api/rounds/category/${encodeURIComponent(selectedCategory)}/standings${query}`,
          { cache: "no-store", credentials: "include" }
        );
        const data = await res.json();
        if (data.standings) {
          setFilteredStandings(data.standings);
        } else {
          setFilteredStandings(overview?.standings || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setStandingsLoading(false);
      }
    };
    fetchStandings();
  }, [selectedCategory, standingsRoundFilter, overview]);

  // Handle Generate / Preview
  const handleGeneratePreview = async (targetRoundNum = null) => {
    setError("");
    setSuccessMsg("");
    setPreviewLoading(true);
    try {
      const res = await fetch("/api/rounds/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          category: selectedCategory,
          roundNumber: targetRoundNum,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate preview.");
      setPreviewData(data.preview);
      setPreviewModalOpen(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Handle Confirm & Publish
  const handleConfirmPublish = async () => {
    if (!previewData) return;
    setPublishSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/rounds/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          category: selectedCategory,
          roundNumber: previewData.roundNumber,
          publishNow: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to publish fixtures.");

      setSuccessMsg(`Successfully published ${previewData.roundName} with ${previewData.fixtures.length} fixture(s)!`);
      setPreviewModalOpen(false);
      setPreviewData(null);
      await fetchOverview();
    } catch (err) {
      setError(err.message);
    } finally {
      setPublishSubmitting(false);
    }
  };

  // Handle Reset Round
  const handleResetSubmit = async () => {
    if (!roundToReset) return;
    setResetSubmitting(true);
    setError("");
    try {
      const resetId = roundToReset._id || roundToReset.id;
      const res = await fetch(`/api/rounds/${resetId}/reset`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reset round.");

      setSuccessMsg(`Round ${roundToReset.roundNumber} has been safely reset.`);
      setResetModalOpen(false);
      setRoundToReset(null);
      await fetchOverview();
    } catch (err) {
      setError(err.message);
    } finally {
      setResetSubmitting(false);
    }
  };

  const rounds = overview?.rounds || [];
  const activeRound = overview?.activeRound || null;
  const matches = overview?.matches || [];
  const competitors = overview?.competitors || [];
  const champion = overview?.champion || null;

  const activeRoundMatches = activeRound
    ? matches.filter((m) => (activeRound.fixtures || []).includes(m.id))
    : [];

  const completedCount = activeRoundMatches.filter((m) => m.status === "completed").length;
  const pendingCount = activeRoundMatches.length - completedCount;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Breadcrumb & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200 mb-2">
            <Layers className="w-3.5 h-3.5 text-teal-600" />
            <span>OFFICIAL TOURNAMENT ENGINE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-black text-primary tracking-tight">
            Round Management & Fixture Generation
          </h1>
          <p className="text-xs text-secondary mt-1">
            Automated draw allocation, bye assignment, points-table knockout progression, and verified match advancement.
          </p>
        </div>

        {/* Global Action Shortcut */}
        <div className="flex items-center gap-2">
          {overview?.canCreateNextRound && (
            <button
              type="button"
              onClick={() => handleGeneratePreview()}
              disabled={previewLoading}
              className="px-4 py-2.5 rounded-xl bg-accent text-white text-xs font-bold hover:bg-teal-700 transition-all shadow-emerald flex items-center gap-2 disabled:opacity-50"
            >
              {previewLoading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Shuffle className="w-3.5 h-3.5" />
              )}
              <span>{rounds.length === 0 ? "Generate Round 1 Draw" : "Create Next Round"}</span>
            </button>
          )}

          <button
            type="button"
            onClick={fetchOverview}
            title="Refresh Tournament State"
            className="p-2.5 rounded-xl border border-border bg-white text-secondary hover:text-primary hover:bg-slate-50 transition-colors shadow-subtle"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
          <button type="button" onClick={() => setError("")} className="text-rose-500 hover:text-rose-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button type="button" onClick={() => setSuccessMsg("")} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Category Selection Tabs */}
      <div className="p-1.5 bg-slate-100 rounded-2xl border border-border flex items-center gap-1 overflow-x-auto no-scrollbar">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 ${
                isSelected
                  ? "bg-white text-primary shadow-subtle font-black"
                  : "text-secondary hover:text-primary hover:bg-white/50"
              }`}
            >
              <span>{cat}</span>
              {selectedCategory === cat && (
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              )}
            </button>
          );
        })}
      </div>

      {/* Category Overview Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Metric 1: Registered Teams */}
        <div className="p-4 rounded-2xl border border-border bg-white shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted text-xs mb-2">
            <span className="font-semibold text-slate-600">Registered Teams</span>
            <Users className="w-4 h-4 text-teal-600" />
          </div>
          <div>
            <div className="text-2xl font-heading font-black text-primary">
              {competitors.length}
            </div>
            <div className="text-[11px] text-muted mt-0.5">
              {competitors.length % 2 === 0 ? "Even draw (No bye needed)" : "Odd draw (1 Bye required)"}
            </div>
          </div>
        </div>

        {/* Metric 2: Current Tournament Stage */}
        <div className="p-4 rounded-2xl border border-border bg-white shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted text-xs mb-2">
            <span className="font-semibold text-slate-600">Current Stage</span>
            <Layers className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <div className="text-xl font-heading font-black text-primary truncate">
              {champion ? "Completed" : activeRound?.roundName || "Not Started"}
            </div>
            <div className="text-[11px] text-muted mt-0.5 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${activeRound?.status === "completed" ? "bg-emerald-500" : activeRound?.status === "published" ? "bg-teal-500 animate-pulse" : "bg-slate-400"}`} />
              <span className="capitalize">{activeRound?.status || "Awaiting Draw"}</span>
            </div>
          </div>
        </div>

        {/* Metric 3: Active Fixtures Status */}
        <div className="p-4 rounded-2xl border border-border bg-white shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted text-xs mb-2">
            <span className="font-semibold text-slate-600">Round Matches</span>
            <Calendar className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <div className="text-2xl font-heading font-black text-primary">
              {completedCount} / {activeRoundMatches.length}
            </div>
            <div className="text-[11px] text-muted mt-0.5">
              {pendingCount === 0 && activeRoundMatches.length > 0
                ? "All fixtures finished!"
                : `${pendingCount} match(es) pending`}
            </div>
          </div>
        </div>

        {/* Metric 4: Champion / Bye Status */}
        <div className="p-4 rounded-2xl border border-border bg-white shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted text-xs mb-2">
            <span className="font-semibold text-slate-600">
              {champion ? "Category Champion" : "Bye Recipient"}
            </span>
            <Trophy className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            {champion ? (
              <div className="truncate text-base font-heading font-black text-amber-700">
                🏆 {champion.name}
              </div>
            ) : activeRound?.byeTeam ? (
              <div className="truncate text-sm font-heading font-bold text-teal-800">
                {activeRound.byeTeam.name}
              </div>
            ) : (
              <div className="text-xs text-muted font-medium">None in active round</div>
            )}
            <div className="text-[11px] text-muted mt-0.5">
              {champion
                ? `Final Score: ${champion.finalScore}`
                : activeRound?.byeTeam
                ? "Advanced to Next Round"
                : "Standard 2-team matches"}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("rounds")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === "rounds"
              ? "bg-primary text-white shadow-subtle"
              : "text-secondary hover:text-primary hover:bg-slate-100"
          }`}
        >
          Round Progression & Matches ({rounds.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("standings")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === "standings"
              ? "bg-primary text-white shadow-subtle"
              : "text-secondary hover:text-primary hover:bg-slate-100"
          }`}
        >
          Category Points Table
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("bracket")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === "bracket"
              ? "bg-primary text-white shadow-subtle"
              : "text-secondary hover:text-primary hover:bg-slate-100"
          }`}
        >
          Knockout Bracket
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("teams")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === "teams"
              ? "bg-primary text-white shadow-subtle"
              : "text-secondary hover:text-primary hover:bg-slate-100"
          }`}
        >
          Registered Competitors ({competitors.length})
        </button>
      </div>

      {/* =========================================================================
          TAB 1: ROUND PROGRESSION & MATCHES
         ========================================================================= */}
      {activeTab === "rounds" && (
        <div className="space-y-8">
          {/* Champion Banner if Final Completed */}
          {champion && (
            <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500/10 via-amber-50 to-emerald-50 border border-amber-300 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black shadow-lg shadow-amber-500/30 shrink-0">
                  <Trophy className="w-8 h-8" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-amber-800 tracking-wider uppercase">
                    Official Category Champion Decided
                  </div>
                  <h2 className="text-2xl font-heading font-black text-primary">
                    {champion.name}
                  </h2>
                  <p className="text-xs text-secondary mt-0.5">
                    Crown Winner of {selectedCategory} • Final Match Concluded ({champion.finalScore})
                  </p>
                </div>
              </div>

              <div className="px-4 py-2 rounded-xl bg-white border border-amber-200 text-center shadow-subtle">
                <span className="text-[10px] font-bold text-muted block uppercase">Tournament Result</span>
                <span className="text-xs font-black text-emerald-700">Gold Trophy Awarded</span>
              </div>
            </div>
          )}

          {/* Initial State: No rounds created yet */}
          {rounds.length === 0 && (
            <div className="p-10 rounded-3xl border border-dashed border-border bg-white text-center shadow-subtle max-w-xl mx-auto space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-teal-50 text-accent flex items-center justify-center mx-auto shadow-emerald">
                <Shuffle className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-heading font-black text-primary">
                  Ready to Start {selectedCategory} Draw
                </h3>
                <p className="text-xs text-secondary max-w-md mx-auto mt-1">
                  There are currently {competitors.length} registered competitor(s). Generate the official first-round draw with random pairing and automatic bye allocation.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleGeneratePreview(1)}
                  disabled={competitors.length < 2 || previewLoading}
                  className="px-6 py-3 rounded-xl bg-accent text-white text-xs font-black hover:bg-teal-700 transition-all shadow-emerald inline-flex items-center gap-2 disabled:opacity-50"
                >
                  {previewLoading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Shuffle className="w-4 h-4" />
                  )}
                  <span>Generate Official Round 1 Draw</span>
                </button>
              </div>
            </div>
          )}

          {/* Active Round Card */}
          {rounds.map((round) => {
            const isCurrentActive = activeRound && activeRound.id === round.id;
            const roundMatches = matches.filter((m) => (round.fixtures || []).includes(m.id));
            const isCompleted = round.status === "completed";
            const canReset = round.status === "published" && roundMatches.every((m) => m.status === "scheduled");

            return (
              <div
                key={round.id}
                className={`rounded-3xl border bg-white shadow-subtle overflow-hidden transition-all ${
                  isCurrentActive
                    ? "border-accent ring-2 ring-accent/10"
                    : "border-border hover:border-slate-300"
                }`}
              >
                {/* Round Header Bar */}
                <div className="px-6 py-4 border-b border-border bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-primary text-white text-xs font-black flex items-center justify-center shadow-subtle">
                      R{round.roundNumber}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-heading font-black text-primary">
                          {round.roundName}
                        </h2>
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase border ${
                            round.status === "completed"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : round.status === "published"
                              ? "bg-teal-50 text-accent border-teal-200 animate-pulse"
                              : "bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          {round.status}
                        </span>
                      </div>
                      <span className="text-[11px] text-muted">
                        {round.totalTeams} Participating Teams • {roundMatches.length} Matches
                        {round.byeTeam ? " • 1 Bye Advanced" : ""}
                      </span>
                    </div>
                  </div>

                  {/* Actions for this round */}
                  <div className="flex items-center gap-2">
                    {round.status === "draft" && (
                      <button
                        type="button"
                        onClick={() => handleGeneratePreview(round.roundNumber)}
                        className="px-3.5 py-1.5 rounded-lg bg-accent text-white text-xs font-bold hover:bg-teal-700 transition-all shadow-subtle"
                      >
                        Publish Fixtures
                      </button>
                    )}

                    {canReset && (
                      <button
                        type="button"
                        onClick={() => {
                          setRoundToReset(round);
                          setResetModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold transition-colors"
                      >
                        Reset Round
                      </button>
                    )}
                  </div>
                </div>

                {/* Round Content */}
                <div className="p-6 space-y-6">
                  {/* Bye Allocation Card if applicable */}
                  {round.byeTeam && (
                    <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-accent text-white flex items-center justify-center font-bold text-xs shadow-emerald shrink-0">
                          BYE
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-teal-800 uppercase tracking-wider">
                            Automatic Bye Advancement
                          </div>
                          <div className="text-sm font-heading font-black text-primary">
                            {round.byeTeam.name}
                          </div>
                          <p className="text-[11px] text-muted">
                            {round.roundNumber === 1
                              ? "Allocated randomly in Round 1 draw for odd-numbered bracket. Advanced directly to next round without match or rally points."
                              : "Allocated to the #1 ranked qualifying team from the points table. Automatically advances to next stage."}
                          </p>
                        </div>
                      </div>

                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-teal-200 text-accent font-bold text-xs shrink-0 shadow-subtle">
                        <CheckCircle2 className="w-3.5 h-3.5 text-accent" />
                        <span>Qualified to Next Round</span>
                      </div>
                    </div>
                  )}

                  {/* Matches List Grid */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-heading font-bold text-primary uppercase tracking-wider">
                        Official Scheduled Fixtures ({roundMatches.length})
                      </h3>
                      <span className="text-[11px] text-muted">
                        Click on fixture or umpire button to score live
                      </span>
                    </div>

                    {roundMatches.length === 0 ? (
                      <div className="p-6 rounded-2xl border border-dashed border-border text-center text-xs text-muted">
                        No matches generated yet.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {roundMatches.map((m) => {
                          const isLive = m.status === "live" || m.status === "tied";
                          const isDone = m.status === "completed";

                          return (
                            <div
                              key={m.id}
                              className={`p-4 rounded-2xl border bg-white transition-all shadow-subtle flex flex-col justify-between ${
                                isLive
                                  ? "border-accent ring-2 ring-accent/15"
                                  : isDone
                                  ? "border-border bg-slate-50/40"
                                  : "border-border hover:border-slate-300"
                              }`}
                            >
                              <div>
                                <div className="flex items-center justify-between text-xs text-muted mb-2 font-medium">
                                  <div className="flex items-center gap-2">
                                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold text-[10px]">
                                      Court {m.court_number}
                                    </span>
                                    <span>Match #{m.match_number}</span>
                                  </div>

                                  {isLive && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-accent bg-accent-light px-2 py-0.5 rounded-full border border-accent-border">
                                      <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
                                      LIVE
                                    </span>
                                  )}
                                  {isDone && (
                                    <span className="text-emerald-700 font-extrabold text-[10px] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                      FINAL
                                    </span>
                                  )}
                                  {!isLive && !isDone && (
                                    <span className="text-slate-500 font-medium text-[10px] bg-slate-100 px-2 py-0.5 rounded">
                                      Upcoming
                                    </span>
                                  )}
                                </div>

                                {/* Participant A */}
                                <div
                                  className={`flex items-center justify-between py-2 px-3 rounded-xl transition-colors ${
                                    m.winner_team === "A"
                                      ? "bg-accent-light text-accent font-black border border-accent-border"
                                      : "text-primary font-medium"
                                  }`}
                                >
                                  <span className="truncate pr-2 text-xs">{m.team_a_name}</span>
                                  <span className="font-mono font-bold text-sm shrink-0">
                                    {m.score_a}
                                  </span>
                                </div>

                                {/* Participant B */}
                                <div
                                  className={`flex items-center justify-between py-2 px-3 rounded-xl mt-1.5 transition-colors ${
                                    m.winner_team === "B"
                                      ? "bg-accent-light text-accent font-black border border-accent-border"
                                      : "text-primary font-medium"
                                  }`}
                                >
                                  <span className="truncate pr-2 text-xs">{m.team_b_name}</span>
                                  <span className="font-mono font-bold text-sm shrink-0">
                                    {m.score_b}
                                  </span>
                                </div>
                              </div>

                              {/* Footer Action */}
                              <div className="pt-3 mt-3 border-t border-border flex items-center justify-between">
                                {isDone && m.winner_name ? (
                                  <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Winner: {m.winner_name}
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-muted">
                                    {m.scheduled_time || "Ready on court"}
                                  </span>
                                )}

                                <Link
                                  href={`/admin/scoring/${m.id}`}
                                  className="px-3 py-1.5 rounded-lg bg-primary text-white text-[11px] font-bold hover:bg-secondary transition-colors inline-flex items-center gap-1 shadow-subtle"
                                >
                                  <Play className="w-3 h-3 fill-current" />
                                  <span>{isDone ? "Review Match" : "Umpire Console"}</span>
                                </Link>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Qualified Teams List */}
                  {round.qualifiedTeams && round.qualifiedTeams.length > 0 && (
                    <div className="p-4 rounded-2xl bg-slate-50 border border-border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-heading font-black text-primary uppercase tracking-wider flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-accent" />
                          Qualified For Next Round ({round.qualifiedTeams.length})
                        </span>
                        <span className="text-[11px] text-muted">Official advancing teams</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {round.qualifiedTeams.map((qt) => (
                          <div
                            key={qt.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-border shadow-xs text-xs font-bold text-primary"
                          >
                            <span>{qt.name}</span>
                            <span
                              className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                                qt.advancementReason === "bye"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-emerald-100 text-emerald-800"
                              }`}
                            >
                              {qt.advancementReason === "bye" ? "BYE" : "MATCH WIN"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Next Round Trigger Prompt */}
                  {isCompleted && !champion && (
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-heading font-black text-accent">
                          Round {round.roundNumber} Officially Completed
                        </div>
                        <p className="text-xs text-secondary mt-0.5">
                          All {roundMatches.length} match(es) have concluded. {round.qualifiedTeams?.length} teams are eligible to advance into Round {round.roundNumber + 1}.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleGeneratePreview(round.roundNumber + 1)}
                        disabled={previewLoading}
                        className="px-5 py-2.5 rounded-xl bg-accent text-white text-xs font-black hover:bg-teal-700 transition-all shadow-emerald flex items-center gap-1.5 shrink-0"
                      >
                        <Shuffle className="w-3.5 h-3.5" />
                        <span>Create Round {round.roundNumber + 1}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* =========================================================================
          TAB 2: POINTS TABLE & STANDINGS
         ========================================================================= */}
      {activeTab === "standings" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-border shadow-subtle">
            <div>
              <h3 className="text-sm font-heading font-black text-primary">
                {selectedCategory} Official Points Table
              </h3>
              <p className="text-xs text-secondary mt-0.5">
                Match Win: +3 Pts • Match Participation: +1 Pt • Byes receive zero fake matches or stats.
              </p>
            </div>

            {/* Round Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-muted" />
              <span className="text-xs font-bold text-secondary">Filter Round:</span>
              <select
                value={standingsRoundFilter}
                onChange={(e) => setStandingsRoundFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-border bg-slate-50 text-xs font-bold text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="all">All Rounds (Cumulative)</option>
                {rounds.map((r) => (
                  <option key={r.id} value={r.roundNumber}>
                    Round {r.roundNumber} ({r.roundName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Standings Table */}
          <div className="rounded-3xl border border-border bg-white shadow-subtle overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-border text-[11px] font-heading font-black text-muted uppercase tracking-wider">
                    <th className="py-3 px-4 w-12 text-center">Rank</th>
                    <th className="py-3 px-4">Team / Competitor</th>
                    <th className="py-3 px-3 text-center">Played</th>
                    <th className="py-3 px-3 text-center">Won</th>
                    <th className="py-3 px-3 text-center">Lost</th>
                    <th className="py-3 px-3 text-center">Rally For</th>
                    <th className="py-3 px-3 text-center">Rally Against</th>
                    <th className="py-3 px-3 text-center">Difference</th>
                    <th className="py-3 px-4 text-center font-black text-accent">Total Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredStandings.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-10 text-center text-muted">
                        No matches played yet in this selection.
                      </td>
                    </tr>
                  ) : (
                    filteredStandings.map((team, idx) => {
                      const diff = team.rally_difference ?? (team.points_scored - team.points_conceded);
                      const isTop = idx === 0;

                      return (
                        <tr
                          key={team.id || idx}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            isTop ? "bg-amber-50/30" : ""
                          }`}
                        >
                          <td className="py-3 px-4 text-center font-bold">
                            {isTop ? (
                              <span className="w-6 h-6 rounded-full bg-amber-500 text-white font-black text-[11px] inline-flex items-center justify-center">
                                1
                              </span>
                            ) : (
                              <span className="text-secondary">{team.rank || idx + 1}</span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-bold text-primary">
                            <div className="flex items-center gap-2">
                              <span>{team.name}</span>
                              {isTop && (
                                <span className="text-[10px] font-extrabold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                                  Top Seed
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-secondary">
                            {team.matches_played || 0}
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-bold text-emerald-700">
                            {team.matches_won || 0}
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-rose-600">
                            {team.matches_lost || 0}
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-secondary">
                            {team.points_scored || 0}
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-secondary">
                            {team.points_conceded || 0}
                          </td>
                          <td className="py-3 px-3 text-center font-mono font-bold">
                            <span className={diff > 0 ? "text-emerald-700" : diff < 0 ? "text-rose-600" : "text-secondary"}>
                              {diff > 0 ? `+${diff}` : diff}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-black text-sm text-accent">
                            {team.total_points ?? team.total_tournament_points ?? 0}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: KNOCKOUT BRACKET VIEW
         ========================================================================= */}
      {activeTab === "bracket" && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white border border-border shadow-subtle flex items-center justify-between">
            <div>
              <h3 className="text-sm font-heading font-black text-primary">
                {selectedCategory} Knockout Bracket Progression
              </h3>
              <p className="text-xs text-secondary mt-0.5">
                Official single-elimination tournament tree connecting all stages to the Champion.
              </p>
            </div>
            <Link
              href="/matches"
              target="_blank"
              className="text-xs font-bold text-accent hover:underline flex items-center gap-1"
            >
              <span>View Public Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Dynamic Bracket Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 items-start">
            {rounds.map((round) => {
              const rMatches = matches.filter((m) => (round.fixtures || []).includes(m.id));

              return (
                <div key={round.id} className="space-y-3">
                  <div className="text-center pb-2 border-b border-border">
                    <span className="text-xs font-heading font-black text-primary uppercase tracking-wider block">
                      {round.roundName}
                    </span>
                    <span className="text-[10px] text-muted font-medium">
                      {rMatches.length} Fixtures • {round.status}
                    </span>
                  </div>

                  {/* Bye indicator in bracket column */}
                  {round.byeTeam && (
                    <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-xs shadow-xs">
                      <div className="text-[10px] font-extrabold text-teal-800 uppercase">
                        ★ BYE ADVANCED
                      </div>
                      <div className="font-bold text-primary truncate mt-0.5">
                        {round.byeTeam.name}
                      </div>
                    </div>
                  )}

                  {/* Matches */}
                  <div className="space-y-2.5">
                    {rMatches.map((m) => {
                      const isAWin = m.winner_team === "A";
                      const isBWin = m.winner_team === "B";

                      return (
                        <div
                          key={m.id}
                          className="p-3 rounded-xl border border-border bg-white text-xs shadow-subtle space-y-1"
                        >
                          <div className="flex items-center justify-between text-[10px] text-muted mb-1 font-semibold">
                            <span>Court {m.court_number}</span>
                            <span className="uppercase">{m.status}</span>
                          </div>

                          <div
                            className={`flex items-center justify-between px-2 py-1 rounded-lg ${
                              isAWin ? "bg-accent-light text-accent font-black border border-accent-border/50" : "text-primary"
                            }`}
                          >
                            <span className="truncate pr-1">{m.team_a_name}</span>
                            <span className="font-mono font-bold">{m.score_a}</span>
                          </div>

                          <div
                            className={`flex items-center justify-between px-2 py-1 rounded-lg ${
                              isBWin ? "bg-accent-light text-accent font-black border border-accent-border/50" : "text-primary"
                            }`}
                          >
                            <span className="truncate pr-1">{m.team_b_name}</span>
                            <span className="font-mono font-bold">{m.score_b}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: REGISTERED COMPETITORS
         ========================================================================= */}
      {activeTab === "teams" && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white border border-border shadow-subtle flex items-center justify-between">
            <div>
              <h3 className="text-sm font-heading font-black text-primary">
                Registered Competitors in {selectedCategory} ({competitors.length})
              </h3>
              <p className="text-xs text-secondary mt-0.5">
                Eligible players/teams officially registered for this category draw.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {competitors.map((c, i) => (
              <div
                key={c.id}
                className="p-3.5 rounded-2xl border border-border bg-white shadow-subtle flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">
                    {i + 1}
                  </span>
                  <div>
                    <div className="text-xs font-bold text-primary truncate max-w-[180px]">
                      {c.name}
                    </div>
                    <span className="text-[10px] text-muted uppercase font-medium">
                      {c.type === "player" ? "Singles Player" : "Doubles Pair"}
                    </span>
                  </div>
                </div>

                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Active
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          CONFIRMATION & PREVIEW MODAL
         ========================================================================= */}
      {previewModalOpen && previewData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-primary/60 backdrop-blur-xs"
            onClick={() => setPreviewModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-border p-6 max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-border shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-accent flex items-center justify-center font-bold">
                  <Shuffle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-lg font-heading font-black text-primary">
                    Confirm & Publish {previewData.roundName}
                  </h3>
                  <span className="text-[11px] text-muted">
                    {selectedCategory} • {previewData.totalTeams} Total Teams
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPreviewModalOpen(false)}
                className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Scrollable */}
            <div className="py-4 space-y-4 overflow-y-auto flex-1 pr-1">
              {/* Bye Alert in Preview */}
              {previewData.byeTeam ? (
                <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200 text-xs">
                  <div className="flex items-center gap-2 font-bold text-accent">
                    <Award className="w-4 h-4" />
                    <span>Allocated Bye: {previewData.byeTeam.name}</span>
                  </div>
                  <p className="text-[11px] text-secondary mt-1">
                    This team automatically qualifies for the next round. Zero fake matches, zero fake scores, and zero false statistics will be created.
                  </p>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-50 border border-border text-xs text-muted">
                  Even team count ({previewData.totalTeams} teams). No bye allocation required.
                </div>
              )}

              {/* Fixtures List in Preview */}
              <div>
                <h4 className="text-xs font-heading font-black text-primary uppercase tracking-wider mb-2.5">
                  Generated Fixtures ({previewData.fixtures.length} matches)
                </h4>
                <div className="space-y-2">
                  {previewData.fixtures.map((f, i) => {
                    const expl = previewData.pairingExplanations?.[i];

                    return (
                      <div
                        key={i}
                        className="p-3 rounded-xl border border-border bg-slate-50/60 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                          <span>Match #{f.match_number} • Court {f.court_number}</span>
                          <span className="text-[10px] text-accent font-extrabold bg-accent-light px-2 py-0.5 rounded">
                            {f.round}
                          </span>
                        </div>

                        <div className="text-xs font-black text-primary py-0.5">
                          {f.team_a_name} <span className="text-muted font-normal">vs</span> {f.team_b_name}
                        </div>

                        {expl && (
                          <div className="text-[10px] text-muted font-medium">
                            {expl.explanation}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Official Qualification Rules Note */}
              <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200 text-[11px] text-amber-900 space-y-1">
                <span className="font-bold flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-amber-700" />
                  Official Progression & Point Rules:
                </span>
                <p>
                  1. Match winners receive 3 victory points + 1 participation point (+4 total). Losers receive 1 participation point.
                </p>
                <p>
                  2. All match winners and the bye recipient advance directly into the next round.
                </p>
                <p>
                  3. Second round fixtures will strictly pair qualified teams using official points table standings (1 vs N).
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-border flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setPreviewModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-border text-xs font-semibold text-secondary hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmPublish}
                disabled={publishSubmitting}
                className="px-5 py-2.5 rounded-xl bg-accent text-white text-xs font-bold hover:bg-teal-700 transition-all shadow-emerald flex items-center gap-2 disabled:opacity-50"
              >
                {publishSubmitting ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>Confirm & Publish Official Draw</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          RESET ROUND CONFIRMATION MODAL
         ========================================================================= */}
      {resetModalOpen && roundToReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-primary/60 backdrop-blur-xs"
            onClick={() => setResetModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-md bg-white rounded-3xl shadow-2xl border border-border p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-heading font-black text-primary">
                  Reset Round {roundToReset.roundNumber}?
                </h3>
                <span className="text-[11px] text-muted">
                  {selectedCategory} • {roundToReset.roundName}
                </span>
              </div>
            </div>

            <p className="text-xs text-secondary leading-relaxed">
              Are you sure you want to reset Round {roundToReset.roundNumber}? All scheduled fixtures in this round will be removed. This action is only permitted because no matches have been played yet.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setResetModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-secondary hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetSubmit}
                disabled={resetSubmitting}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors shadow-subtle disabled:opacity-50"
              >
                {resetSubmitting ? "Resetting..." : "Yes, Reset Round"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
