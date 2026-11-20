"use client";

import { useState, useEffect } from "react";
import { Trophy, Plus, History, ArrowUpDown, CheckCircle, AlertCircle, X, Sparkles } from "lucide-react";

export default function AdminPointsPage() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [history, setHistory] = useState([]);
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  // Manual Adjustment Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [adjEntityId, setAdjEntityId] = useState("");
  const [adjEntityType, setAdjEntityType] = useState("player");
  const [adjCategory, setAdjCategory] = useState("Men's Singles");
  const [adjDelta, setAdjDelta] = useState(1);
  const [adjReason, setAdjReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

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

      {/* Standings Table */}
      <div className="bg-white rounded-2xl border border-border shadow-subtle overflow-hidden">
        <div className="p-4 border-b border-border bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <h2 className="text-xs font-heading font-bold text-primary uppercase tracking-wider">
              Official Leaderboard Standings ({leaderboard.length} entries)
            </h2>
          </div>
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
              {leaderboard.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted">
                    No points recorded yet.
                  </td>
                </tr>
              ) : (
                leaderboard.map((r, idx) => (
                  <tr key={r.id || idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-primary">
                      {idx === 0 ? (
                        <span className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 inline-flex items-center justify-center text-xs font-black">
                          1
                        </span>
                      ) : idx === 1 ? (
                        <span className="w-6 h-6 rounded-full bg-slate-300 text-slate-900 inline-flex items-center justify-center text-xs font-black">
                          2
                        </span>
                      ) : idx === 2 ? (
                        <span className="w-6 h-6 rounded-full bg-amber-700 text-white inline-flex items-center justify-center text-xs font-black">
                          3
                        </span>
                      ) : (
                        <span className="text-muted ml-2 font-mono font-bold">#{idx + 1}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-primary">{r.entity_name}</td>
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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