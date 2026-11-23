"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronRight, Radio, Clock, AlertTriangle, Shield, Activity } from "lucide-react";

export default function LiveScoreboardCard({ match, onOpenDetail }) {
  if (!match) return null;

  const isServingA = match.serving_team === "A";
  const isServingB = match.serving_team === "B";
  const isTied = match.status === "tied";
  const isSuddenDeathTimer = match.timer_mode === "SUDDEN_DEATH" || Boolean(match.is_sudden_death);

  // Check game status context
  const maxScore = Math.max(match.score_a, match.score_b);
  const minScore = Math.min(match.score_a, match.score_b);
  const isDeuce = match.score_a >= 10 && match.score_b >= 10;
  const isSuddenDeathNormal = match.score_a === 14 && match.score_b === 14;
  const isSuddenDeath = isSuddenDeathNormal || isSuddenDeathTimer;
  const isGamePoint =
    (!isDeuce && maxScore === 10) ||
    (isDeuce && !isSuddenDeath && maxScore >= 10 && maxScore - minScore === 1) ||
    isSuddenDeath;

  // Live countdown remaining or sudden death stopwatch counting UP
  const [liveRemaining, setLiveRemaining] = useState(
    match.timer_remaining_seconds ?? match.timer_duration_seconds ?? 0
  );
  const [stopwatchSeconds, setStopwatchSeconds] = useState(0);

  useEffect(() => {
    if (isSuddenDeathTimer) {
      const calcStopwatch = () => {
        if (!match.sudden_death_start_ts) return 0;
        const startMs = new Date(match.sudden_death_start_ts).getTime();
        return Math.max(0, Math.floor((Date.now() - startMs) / 1000));
      };
      setStopwatchSeconds(calcStopwatch());
      if (match.timer_status === "running") {
        const interval = setInterval(() => {
          setStopwatchSeconds(calcStopwatch());
        }, 1000);
        return () => clearInterval(interval);
      }
      return;
    }

    if (!match.timer_enabled || match.timer_status !== "running" || !match.timer_start_ts) {
      setLiveRemaining(match.timer_remaining_seconds ?? match.timer_duration_seconds ?? 0);
      return;
    }
    const calc = () => {
      const startMs = new Date(match.timer_start_ts).getTime();
      const elapsed = Math.floor((Date.now() - startMs) / 1000);
      const base = match.timer_remaining_seconds ?? match.timer_duration_seconds ?? 0;
      return Math.max(base - elapsed, 0);
    };
    setLiveRemaining(calc());
    const interval = setInterval(() => {
      setLiveRemaining(calc());
    }, 1000);
    return () => clearInterval(interval);
  }, [
    isSuddenDeathTimer,
    match.sudden_death_start_ts,
    match.timer_enabled,
    match.timer_status,
    match.timer_start_ts,
    match.timer_remaining_seconds,
    match.timer_duration_seconds,
  ]);

  const timerMins = Math.floor(liveRemaining / 60);
  const timerSecs = liveRemaining % 60;
  const timerFormatted = `${String(timerMins).padStart(2, "0")}:${String(timerSecs).padStart(2, "0")}`;

  const swMins = Math.floor(stopwatchSeconds / 60);
  const swSecs = stopwatchSeconds % 60;
  const stopwatchFormatted = `${String(swMins).padStart(2, "0")}:${String(swSecs).padStart(2, "0")}`;

  return (
    <div
      className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden shadow-card hover:shadow-elevated ${
        isSuddenDeathTimer
          ? "border-rose-400 ring-2 ring-rose-400/20"
          : isGamePoint
          ? "border-amber-300 ring-2 ring-amber-300/20"
          : "border-border hover:border-slate-300"
      }`}
    >
      {/* Top Banner Bar */}
      <div
        className={`px-3.5 sm:px-5 py-2.5 sm:py-3 border-b flex flex-wrap items-center justify-between gap-2 ${
          isSuddenDeathTimer
            ? "bg-rose-50/80 border-rose-200"
            : isGamePoint
            ? "bg-amber-50/70 border-amber-200"
            : "bg-slate-50/80 border-border"
        }`}
      >
        <div className="flex items-center gap-2 flex-wrap">
          {/* Live Indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 sm:py-1 rounded-full bg-accent-light border border-accent-border text-accent text-[11px] sm:text-xs font-bold">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-accent animate-ping" />
            <span>COURT {match.court_number || 1}</span>
          </div>

          <span className="text-[11px] sm:text-xs font-semibold text-secondary">
            {match.category} • <span className="text-primary font-bold">{match.round}</span>
          </span>
        </div>

        {/* Status badges */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {isSuddenDeathTimer ? (
            <span className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black bg-rose-600 text-white shadow-xs animate-pulse">
              ⚡ SUDDEN DEATH
            </span>
          ) : isGamePoint ? (
            <span className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-amber-500 text-white shadow-xs">
              🔥 GAME POINT
            </span>
          ) : isDeuce ? (
            <span className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-slate-200 text-slate-800">
              DEUCE
            </span>
          ) : null}

          {/* Timer Display */}
          {match.timer_enabled && (
            <div className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg bg-white border border-border text-[11px] sm:text-xs font-mono font-bold text-slate-700 shadow-subtle">
              <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-accent" />
              <span>{isSuddenDeathTimer ? stopwatchFormatted : timerFormatted}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Scoring Arena */}
      <div className="p-3.5 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6 items-center">
          {/* Team A */}
          <div
            className={`p-3.5 sm:p-4 rounded-xl border transition-all ${
              isServingA
                ? "bg-accent-light/50 border-accent-border ring-1 ring-accent-border"
                : "bg-slate-50/60 border-border"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted">
                Side A
              </span>
              {isServingA && (
                <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-extrabold bg-accent text-white shadow-xs">
                  🏸 Serving ({match.service_court || "right"})
                </span>
              )}
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h4 className="text-base sm:text-lg font-heading font-black text-primary truncate">
                  {match.team_a_name}
                </h4>
                <p className="text-[11px] sm:text-xs text-secondary mt-0.5 truncate">
                  {match.team_a_player1?.full_name || "Primary Player"}
                </p>
              </div>

              <div className="text-3xl sm:text-5xl font-mono font-black text-primary tabular-nums shrink-0">
                {match.score_a}
              </div>
            </div>
          </div>

          {/* Team B */}
          <div
            className={`p-3.5 sm:p-4 rounded-xl border transition-all ${
              isServingB
                ? "bg-accent-light/50 border-accent-border ring-1 ring-accent-border"
                : "bg-slate-50/60 border-border"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5 sm:mb-2">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted">
                Side B
              </span>
              {isServingB && (
                <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-extrabold bg-accent text-white shadow-xs">
                  🏸 Serving ({match.service_court || "right"})
                </span>
              )}
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h4 className="text-base sm:text-lg font-heading font-black text-primary truncate">
                  {match.team_b_name}
                </h4>
                <p className="text-[11px] sm:text-xs text-secondary mt-0.5 truncate">
                  {match.team_b_player1?.full_name || "Primary Player"}
                </p>
              </div>

              <div className="text-3xl sm:text-5xl font-mono font-black text-primary tabular-nums shrink-0">
                {match.score_b}
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="mt-3.5 sm:mt-5 pt-3 sm:pt-4 border-t border-border flex flex-col xs:flex-row items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2 text-muted text-[11px] sm:text-xs self-start xs:self-auto">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            <span>Target: First to 11 pts (cap 15)</span>
          </div>

          {onOpenDetail && (
            <button
              type="button"
              onClick={() => onOpenDetail(match)}
              className="w-full xs:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-accent bg-accent-light border border-accent-border hover:bg-emerald-100 transition-colors text-xs"
            >
              <span>View 2D Court & Rally Log</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
