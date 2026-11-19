"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronRight, Radio, Volume2, Clock, AlertTriangle } from "lucide-react";

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
    <div className={`bg-surface rounded-2xl border transition-all shadow-card overflow-hidden ${
      isSuddenDeathTimer ? "border-amber-400 ring-2 ring-amber-400/20" : "border-border hover:border-slate-300"
    }`}>
      {/* Header bar */}
      <div className={`px-6 py-3.5 border-b flex flex-wrap items-center justify-between gap-3 ${
        isSuddenDeathTimer ? "bg-amber-50/70 border-amber-200" : "bg-slate-50/60 border-border/80"
      }`}>
        <div className="flex items-center gap-3">
          {isSuddenDeathTimer ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-600 text-white tracking-wide shadow-xs animate-pulse">
              <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
              SUDDEN DEATH — NEXT POINT WINS
            </span>
          ) : isTied ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300 animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              TIME EXPIRED — MATCH TIED
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200">
              <span className="w-2 h-2 rounded-full bg-accent animate-ping"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
              LIVE ON COURT
            </span>
          )}
          <span className="text-xs font-bold text-primary uppercase tracking-wider bg-white px-2.5 py-0.5 rounded-md border border-border">
            Court {match.court_number}
          </span>
          <span className="text-muted/60 text-xs hidden sm:inline">•</span>
          <span className="text-xs text-muted font-semibold hidden sm:inline">{match.category}</span>
          <span className="text-muted/60 text-xs hidden sm:inline">•</span>
          <span className="text-xs text-muted hidden sm:inline">{match.round}</span>
        </div>

        {/* Status badges & timer */}
        <div className="flex items-center gap-2">
          {isSuddenDeathTimer ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-bold bg-amber-100 text-amber-950 border border-amber-300 shadow-2xs">
              <Clock className="w-3.5 h-3.5 text-amber-700 animate-spin" style={{ animationDuration: "3s" }} />
              +{stopwatchFormatted}
            </span>
          ) : match.timer_enabled && !isTied ? (
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-bold ${
                liveRemaining <= 60 && match.timer_status === "running"
                  ? "bg-rose-50 text-rose-700 border border-rose-300 animate-pulse"
                  : "bg-white text-slate-800 border border-border shadow-2xs"
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-muted" />
              {match.timer_status === "paused"
                ? `PAUSED (${timerFormatted})`
                : match.timer_status === "stopped"
                ? `READY (${timerFormatted})`
                : timerFormatted}
            </span>
          ) : null}
          {isSuddenDeathNormal && (
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
              Sudden Death (14-14)
            </span>
          )}
          {isDeuce && !isSuddenDeath && (
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              Deuce
            </span>
          )}
          {isGamePoint && !isSuddenDeathTimer && (
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-300">
              Game Point
            </span>
          )}
        </div>
      </div>

      {/* Main Scoreboard Arena */}
      <div className="p-6 sm:p-7">
        {isSuddenDeathTimer && (
          <div className="mb-5 p-3 rounded-xl bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-amber-500/10 border border-amber-300 flex items-center justify-center gap-2 text-xs font-bold text-amber-950 text-center">
            <span className="text-rose-600 font-extrabold uppercase tracking-wider">⚡ Sudden Death Active:</span>
            <span>Next valid point immediately wins the match. Normal 11/15pt target rules suspended!</span>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-11 gap-6 items-center">
          {/* Team / Player A */}
          <div className="md:col-span-4 flex items-center gap-4">
            <div className="w-13 h-13 rounded-2xl bg-slate-100 border border-slate-200/80 flex items-center justify-center text-primary font-heading font-extrabold text-base shrink-0 shadow-2xs">
              {getInitials(match.team_a_name)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-heading font-bold text-primary truncate">
                  {match.team_a_name}
                </h3>
                {isServingA && (
                  <span
                    title={`Serving (${match.service_court} court)`}
                    className="inline-flex items-center gap-1 text-[10px] font-bold bg-accent text-white px-2 py-0.5 rounded-full shadow-2xs shrink-0"
                  >
                    <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2a4 4 0 0 0-4 4c0 1.5.8 2.8 2 3.5V14l-4 3v3l5-1 1 2 1-2 5 1v-3l-4-3V9.5c1.2-.7 2-2 2-3.5a4 4 0 0 0-4-4z" />
                    </svg>
                    Serve
                  </span>
                )}
              </div>
              <div className="text-xs text-muted flex items-center gap-2 mt-1 font-medium">
                <span>{match.court_side_a === "left" ? "Left Court" : "Right Court"}</span>
                {isServingA && (
                  <>
                    <span>•</span>
                    <span className="capitalize text-teal-700 font-semibold">
                      {match.service_court} Service Box
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Scores Display */}
          <div className="md:col-span-3 flex items-center justify-center gap-5 py-3 px-6 bg-slate-50/90 rounded-2xl border border-slate-200/60 shadow-2xs">
            <div className="text-center min-w-[3rem]">
              <span className={`text-4xl sm:text-5xl font-heading font-black tracking-tight ${isServingA ? "text-teal-700" : "text-primary"}`}>
                {match.score_a}
              </span>
            </div>
            <span className="text-2xl font-light text-slate-300 select-none">:</span>
            <div className="text-center min-w-[3rem]">
              <span className={`text-4xl sm:text-5xl font-heading font-black tracking-tight ${isServingB ? "text-teal-700" : "text-primary"}`}>
                {match.score_b}
              </span>
            </div>
          </div>

          {/* Team / Player B */}
          <div className="md:col-span-4 flex items-center justify-end gap-4 text-right">
            <div className="min-w-0">
              <div className="flex items-center justify-end gap-2">
                {isServingB && (
                  <span
                    title={`Serving (${match.service_court} court)`}
                    className="inline-flex items-center gap-1 text-[10px] font-bold bg-accent text-white px-2 py-0.5 rounded-full shadow-2xs shrink-0"
                  >
                    <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2a4 4 0 0 0-4 4c0 1.5.8 2.8 2 3.5V14l-4 3v3l5-1 1 2 1-2 5 1v-3l-4-3V9.5c1.2-.7 2-2 2-3.5a4 4 0 0 0-4-4z" />
                    </svg>
                    Serve
                  </span>
                )}
                <h3 className="text-base sm:text-lg font-heading font-bold text-primary truncate">
                  {match.team_b_name}
                </h3>
              </div>
              <div className="text-xs text-muted flex items-center justify-end gap-2 mt-1 font-medium">
                {isServingB && (
                  <>
                    <span className="capitalize text-teal-700 font-semibold">
                      {match.service_court} Service Box
                    </span>
                    <span>•</span>
                  </>
                )}
                <span>{match.court_side_a === "left" ? "Right Court" : "Left Court"}</span>
              </div>
            </div>
            <div className="w-13 h-13 rounded-2xl bg-slate-100 border border-slate-200/80 flex items-center justify-center text-primary font-heading font-extrabold text-base shrink-0 shadow-2xs">
              {getInitials(match.team_b_name)}
            </div>
          </div>
        </div>

        {/* Footer info bar */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2.5 text-muted font-medium">
            {isSuddenDeathTimer ? (
              <>
                <span className="font-bold text-rose-600">⚡ Sudden Death Tiebreaker</span>
                <span className="text-slate-300">•</span>
                <span className="font-semibold text-amber-900">Next Point Wins</span>
                <span className="text-slate-300">•</span>
                <span>Stopwatch counting up</span>
              </>
            ) : (
              <>
                <span className="font-semibold text-slate-700">First to 11 Points</span>
                <span className="text-slate-300">•</span>
                <span>Rally Scoring</span>
                <span className="text-slate-300">•</span>
                <span>Deuce Cap 15-14</span>
              </>
            )}
          </div>

          {onOpenDetail && (
            <button
              onClick={() => onOpenDetail(match)}
              className="inline-flex items-center gap-1.5 font-semibold text-primary hover:text-accent transition-colors"
            >
              <span>Court View & History</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function getInitials(name) {
  if (!name) return "B";
  const parts = name.split(" ").filter(Boolean);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
