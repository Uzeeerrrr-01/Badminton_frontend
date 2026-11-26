"use client";

import { useState } from "react";
import { X, Trophy, Shuffle, CheckCircle2, Timer } from "lucide-react";
import { isDoublesCategory } from "@/lib/scoringEngine";

export default function TossModal({ isOpen, onClose, match, onConfirmStart }) {
  if (!isOpen || !match) return null;

  const isDoubles = isDoublesCategory(match.category);

  const [tossWinner, setTossWinner] = useState("A");
  const [tossChoice, setTossChoice] = useState("serve"); // 'serve' | 'receive'
  const [courtSideA, setCourtSideA] = useState("left"); // 'left' | 'right'

  const existingDuration = Number(match.timer_duration_seconds || 0);
  const [timerEnabled, setTimerEnabled] = useState(Boolean(match.timer_enabled));
  const [timerMinutes, setTimerMinutes] = useState(
    existingDuration > 0 ? Math.floor(existingDuration / 60) : 10
  );
  const [timerSeconds, setTimerSeconds] = useState(
    existingDuration > 0 ? existingDuration % 60 : 0
  );

  // Server & Receiver selections
  const teamAPlayers = [
    match.team_a_player1_id ? { id: match.team_a_player1_id, name: match.team_a_player1?.full_name || match.team_a_name.split("/")[0]?.trim() } : null,
    match.team_a_player2_id ? { id: match.team_a_player2_id, name: match.team_a_player2?.full_name || match.team_a_name.split("/")[1]?.trim() } : null,
  ].filter(Boolean);

  const teamBPlayers = [
    match.team_b_player1_id ? { id: match.team_b_player1_id, name: match.team_b_player1?.full_name || match.team_b_name.split("/")[0]?.trim() } : null,
    match.team_b_player2_id ? { id: match.team_b_player2_id, name: match.team_b_player2?.full_name || match.team_b_name.split("/")[1]?.trim() } : null,
  ].filter(Boolean);

  const servingTeam =
    tossWinner === "A"
      ? tossChoice === "serve"
        ? "A"
        : "B"
      : tossChoice === "serve"
      ? "B"
      : "A";

  const [initialServerId, setInitialServerId] = useState(
    servingTeam === "A" ? teamAPlayers[0]?.id : teamBPlayers[0]?.id
  );
  const [initialReceiverId, setInitialReceiverId] = useState(
    servingTeam === "A" ? teamBPlayers[0]?.id : teamAPlayers[0]?.id
  );

  const handleTossWinnerChange = (winner) => {
    setTossWinner(winner);
    const newServingTeam =
      winner === "A"
        ? tossChoice === "serve"
          ? "A"
          : "B"
        : tossChoice === "serve"
        ? "B"
        : "A";
    setInitialServerId(
      newServingTeam === "A" ? teamAPlayers[0]?.id : teamBPlayers[0]?.id
    );
    setInitialReceiverId(
      newServingTeam === "A" ? teamBPlayers[0]?.id : teamAPlayers[0]?.id
    );
  };

  const handleTossChoiceChange = (choice) => {
    setTossChoice(choice);
    const newServingTeam =
      tossWinner === "A"
        ? choice === "serve"
          ? "A"
          : "B"
        : choice === "serve"
        ? "B"
        : "A";
    setInitialServerId(
      newServingTeam === "A" ? teamAPlayers[0]?.id : teamBPlayers[0]?.id
    );
    setInitialReceiverId(
      newServingTeam === "A" ? teamBPlayers[0]?.id : teamAPlayers[0]?.id
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const totalSeconds = Math.max(0, (Number(timerMinutes) || 0) * 60 + (Number(timerSeconds) || 0));
    onConfirmStart({
      tossWinner,
      tossChoice,
      courtSideA,
      initialServerId,
      initialReceiverId,
      timer_enabled: timerEnabled && totalSeconds > 0,
      timer_duration_seconds: timerEnabled ? totalSeconds : 0,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-surface rounded-2xl max-w-lg w-full border border-border shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Shuffle className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-primary">Pre-Match Toss & Service Setup</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted hover:text-primary hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-sm">
          {/* Toss Winner */}
          <div>
            <label className="block text-xs font-semibold text-primary uppercase tracking-wider mb-2">
              1. Toss Winner
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleTossWinnerChange("A")}
                className={`p-3 rounded-xl border text-left font-medium transition-all ${
                  tossWinner === "A"
                    ? "border-emerald-500 bg-emerald-50/50 text-emerald-950 ring-2 ring-emerald-500/20"
                    : "border-border hover:bg-slate-50 text-slate-700"
                }`}
              >
                <div className="text-xs text-muted">Team / Player A</div>
                <div className="font-bold truncate mt-0.5">{match.team_a_name}</div>
              </button>

              <button
                type="button"
                onClick={() => handleTossWinnerChange("B")}
                className={`p-3 rounded-xl border text-left font-medium transition-all ${
                  tossWinner === "B"
                    ? "border-emerald-500 bg-emerald-50/50 text-emerald-950 ring-2 ring-emerald-500/20"
                    : "border-border hover:bg-slate-50 text-slate-700"
                }`}
              >
                <div className="text-xs text-muted">Team / Player B</div>
                <div className="font-bold truncate mt-0.5">{match.team_b_name}</div>
              </button>
            </div>
          </div>

          {/* Choice: Serve or Receive */}
          <div>
            <label className="block text-xs font-semibold text-primary uppercase tracking-wider mb-2">
              2. Toss Winner Choice
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleTossChoiceChange("serve")}
                className={`py-2.5 px-3 rounded-lg border text-center font-medium transition-all ${
                  tossChoice === "serve"
                    ? "border-emerald-500 bg-emerald-500 text-white font-bold"
                    : "border-border hover:bg-slate-50 text-slate-700"
                }`}
              >
                Serve First
              </button>

              <button
                type="button"
                onClick={() => handleTossChoiceChange("receive")}
                className={`py-2.5 px-3 rounded-lg border text-center font-medium transition-all ${
                  tossChoice === "receive"
                    ? "border-emerald-500 bg-emerald-500 text-white font-bold"
                    : "border-border hover:bg-slate-50 text-slate-700"
                }`}
              >
                Receive First
              </button>
            </div>
          </div>

          {/* Court Side Selection */}
          <div>
            <label className="block text-xs font-semibold text-primary uppercase tracking-wider mb-2">
              3. Starting Court Side for Team A
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setCourtSideA("left")}
                className={`py-2 px-3 rounded-lg border text-xs font-medium ${
                  courtSideA === "left"
                    ? "border-primary bg-primary text-white font-semibold"
                    : "border-border hover:bg-slate-50 text-slate-700"
                }`}
              >
                Team A on Left Side
              </button>
              <button
                type="button"
                onClick={() => setCourtSideA("right")}
                className={`py-2 px-3 rounded-lg border text-xs font-medium ${
                  courtSideA === "right"
                    ? "border-primary bg-primary text-white font-semibold"
                    : "border-border hover:bg-slate-50 text-slate-700"
                }`}
              >
                Team A on Right Side
              </button>
            </div>
          </div>

          {/* Initial Server Selection (Especially for doubles) */}
          {isDoubles && (
            <div className="pt-2 border-t border-border space-y-3">
              <div>
                <label className="block text-xs font-semibold text-primary uppercase tracking-wider mb-1">
                  4. Initial Server ({servingTeam === "A" ? match.team_a_name : match.team_b_name})
                </label>
                <select
                  value={initialServerId || ""}
                  onChange={(e) => setInitialServerId(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-white text-primary text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {(servingTeam === "A" ? teamAPlayers : teamBPlayers).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Starts in Right Service Court)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-primary uppercase tracking-wider mb-1">
                  5. Initial Receiver ({servingTeam === "A" ? match.team_b_name : match.team_a_name})
                </label>
                <select
                  value={initialReceiverId || ""}
                  onChange={(e) => setInitialReceiverId(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-white text-primary text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {(servingTeam === "A" ? teamBPlayers : teamAPlayers).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Receives first in Right Service Court)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Custom Match Timer (Optional) */}
          <div className="pt-3 border-t border-border space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Timer className="w-4 h-4 text-teal-600" />
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                  Custom Match Timer
                </span>
              </div>
              <button
                type="button"
                onClick={() => setTimerEnabled(!timerEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  timerEnabled ? "bg-emerald-600" : "bg-slate-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    timerEnabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {timerEnabled && (
              <div className="space-y-2.5 p-3 rounded-xl bg-slate-50 border border-border">
                <div className="flex flex-wrap gap-1.5">
                  {[5, 10, 15, 20].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setTimerMinutes(m);
                        setTimerSeconds(0);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                        Number(timerMinutes) === m && Number(timerSeconds) === 0
                          ? "bg-primary text-white border-primary"
                          : "bg-white text-slate-700 border-border hover:bg-slate-100"
                      }`}
                    >
                      {m} min
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Minutes
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="120"
                      value={timerMinutes}
                      onChange={(e) => setTimerMinutes(e.target.value)}
                      className="w-full px-3 py-1.5 border border-border rounded-lg bg-white text-primary font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Seconds
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={timerSeconds}
                      onChange={(e) => setTimerSeconds(e.target.value)}
                      className="w-full px-3 py-1.5 border border-border rounded-lg bg-white text-primary font-mono text-sm"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="pt-4 border-t border-border flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-muted hover:text-primary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-subtle flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              Start Official Match
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
