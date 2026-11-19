"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Timer, Pause, Play, RotateCcw, Volume2, VolumeX, Flame } from "lucide-react";

export default function MatchTimer({ matchId, match, onMatchUpdate }) {
  const timerEnabled = match?.timer_enabled;
  const configuredDuration = match?.timer_duration_seconds || 0;
  const timerStatus = match?.timer_status || "stopped";
  const timerStartTs = match?.timer_start_ts;
  const timerRemainingSeconds = match?.timer_remaining_seconds ?? configuredDuration;

  const isSuddenDeath = match?.timer_mode === "SUDDEN_DEATH" || Boolean(match?.is_sudden_death);
  const suddenDeathStartTs = match?.sudden_death_start_ts;

  const [displaySeconds, setDisplaySeconds] = useState(timerRemainingSeconds);
  const [stopwatchSeconds, setStopwatchSeconds] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [expired, setExpired] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);

  const rafRef = useRef(null);
  const audioRef = useRef(null);
  const expiredRef = useRef(false);
  const lastDisplayRef = useRef(displaySeconds);

  // Play beep using Web Audio API (no file required)
  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const beep = (freq, start, dur) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "square";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.8, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + dur);
      };
      beep(880, 0, 0.3);
      beep(880, 0.4, 0.3);
      beep(1100, 0.8, 0.6);
    } catch (_) {}
  };

  // Compute remaining seconds for countdown
  const computeRemaining = useCallback(() => {
    if (timerStatus === "running" && timerStartTs) {
      const startMs = new Date(timerStartTs).getTime();
      const elapsedSec = Math.floor((Date.now() - startMs) / 1000);
      return Math.max(timerRemainingSeconds - elapsedSec, 0);
    }
    return timerRemainingSeconds;
  }, [timerStatus, timerStartTs, timerRemainingSeconds]);

  // Compute stopwatch seconds for sudden death (counts UP from 0)
  const computeStopwatch = useCallback(() => {
    if (!suddenDeathStartTs) return 0;
    const startMs = new Date(suddenDeathStartTs).getTime();
    return Math.max(0, Math.floor((Date.now() - startMs) / 1000));
  }, [suddenDeathStartTs]);

  // Main timer loop
  useEffect(() => {
    if (!timerEnabled) return;

    if (isSuddenDeath) {
      setExpired(false);
      expiredRef.current = false;
      const initialUp = computeStopwatch();
      setStopwatchSeconds(initialUp);

      const tickUp = () => {
        setStopwatchSeconds(computeStopwatch());
        if (timerStatus === "running") {
          rafRef.current = requestAnimationFrame(tickUp);
        }
      };

      if (timerStatus === "running") {
        rafRef.current = requestAnimationFrame(tickUp);
      }
      return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      };
    }

    setExpired(false);
    expiredRef.current = false;

    const tick = () => {
      const rem = computeRemaining();
      if (rem !== lastDisplayRef.current) {
        lastDisplayRef.current = rem;
        setDisplaySeconds(rem);
      }

      if (rem <= 0 && !expiredRef.current && timerStatus === "running") {
        expiredRef.current = true;
        setExpired(true);
        // Play buzzer
        if (soundEnabled) {
          if (audioRef.current && audioRef.current.src && !audioRef.current.error) {
            audioRef.current.currentTime = 0;
            audioRef.current.volume = 1;
            audioRef.current.play().catch(() => playBeep());
          } else {
            playBeep();
          }
        }
        // Notify backend to check expiration (Scenario A leading win vs Scenario B sudden death)
        fetch(`/api/matches/${matchId}/timer`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "check" }),
        })
          .then((r) => r.json())
          .then((data) => {
            if (data.match && onMatchUpdate) onMatchUpdate(data.match);
          })
          .catch(console.error);
        return;
      }

      if (timerStatus === "running" && rem > 0) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    if (timerStatus === "running") {
      rafRef.current = requestAnimationFrame(tick);
    } else {
      setDisplaySeconds(timerRemainingSeconds);
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [
    timerStatus,
    timerStartTs,
    matchId,
    soundEnabled,
    timerEnabled,
    computeRemaining,
    computeStopwatch,
    timerRemainingSeconds,
    isSuddenDeath,
    onMatchUpdate,
  ]);

  const sendAction = async (action) => {
    if (actionInProgress) return;
    if (action === "reset" && !confirm("Reset timer to original duration?")) return;
    setActionInProgress(true);
    try {
      const res = await fetch(`/api/matches/${matchId}/timer`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.match && onMatchUpdate) {
        onMatchUpdate(data.match);
        setExpired(false);
        expiredRef.current = false;
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionInProgress(false);
    }
  };

  const testSound = () => {
    playBeep();
  };

  const fmt = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  if (!timerEnabled) return null;

  const isRunning = timerStatus === "running";
  const isPaused = timerStatus === "paused";
  const isStopped = timerStatus === "stopped";
  const isWarning = !isSuddenDeath && displaySeconds <= 60 && displaySeconds > 0;

  return (
    <div
      className={`rounded-2xl border p-5 transition-all shadow-subtle ${
        isSuddenDeath
          ? "border-amber-400 bg-amber-50/80 text-amber-950 shadow-md"
          : expired
          ? "border-rose-300 bg-rose-50/80 text-rose-950"
          : isWarning
          ? "border-amber-300 bg-amber-50/70 text-amber-950"
          : "border-border bg-white text-primary"
      }`}
    >
      {/* Audio element for timer buzzer */}
      <audio ref={audioRef} src="/sounds/timer_end.mp3" preload="auto" />

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className={`p-1.5 rounded-lg ${
              isSuddenDeath
                ? "bg-amber-200 text-amber-900 animate-pulse"
                : expired
                ? "bg-rose-100 text-rose-700"
                : isRunning
                ? "bg-teal-50 text-teal-600"
                : "bg-slate-100 text-muted"
            }`}
          >
            {isSuddenDeath ? <Flame className="w-4 h-4 fill-amber-500" /> : <Timer className="w-4 h-4" />}
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
              {isSuddenDeath ? "Sudden-Death Stopwatch" : "Official Match Timer"}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              {isSuddenDeath && isRunning && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                  STOPWATCH ACTIVE (COUNTING UP)
                </span>
              )}
              {!isSuddenDeath && isRunning && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700">
                  <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping"></span>
                  COUNTDOWN ACTIVE
                </span>
              )}
              {isPaused && (
                <span className="text-[11px] font-semibold text-amber-700">
                  ⏸ CLOCK PAUSED
                </span>
              )}
              {isStopped && !expired && !isSuddenDeath && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  READY TO START
                </span>
              )}
              {expired && !isSuddenDeath && (
                <span className="text-[11px] font-bold text-rose-700 animate-pulse">
                  TIME EXPIRED
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSoundEnabled((s) => !s)}
            className="p-2 rounded-lg text-muted hover:text-primary hover:bg-slate-100 transition-colors"
            title={soundEnabled ? "Mute buzzer sound" : "Enable buzzer sound"}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-slate-700" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-400" />
            )}
          </button>
          <button
            type="button"
            onClick={testSound}
            className="text-[11px] font-medium px-2.5 py-1 rounded-lg border border-border bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors"
          >
            Test Buzzer
          </button>
        </div>
      </div>

      {/* Large Digital Clock / Stopwatch Display */}
      <div className="text-center py-3 bg-slate-50/70 rounded-xl border border-border/80">
        {isSuddenDeath ? (
          <div>
            <div className="text-5xl sm:text-6xl font-heading font-black tracking-tight text-amber-900 font-mono tabular-nums">
              +{fmt(stopwatchSeconds)}
            </div>
            <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-amber-200 text-amber-950 text-xs font-black uppercase tracking-wider animate-pulse">
              <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
              SUDDEN DEATH — NEXT POINT WINS
            </div>
            <p className="text-[11px] text-amber-800 font-medium mt-1">
              Time expired with tied scores. Next point awarded immediately wins the match.
            </p>
          </div>
        ) : expired ? (
          <div>
            <div className="text-5xl sm:text-6xl font-heading font-black tracking-tight text-rose-600 font-mono">
              00:00
            </div>
            <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold animate-pulse">
              ⏰ TIME EXPIRED — EVALUATING WINNER
            </div>
          </div>
        ) : (
          <div>
            <div
              className={`text-5xl sm:text-6xl font-heading font-black tracking-tight font-mono tabular-nums ${
                isWarning ? "text-amber-600 animate-pulse" : "text-primary"
              }`}
            >
              {fmt(displaySeconds)}
            </div>
            <div className="text-[11px] text-muted font-medium mt-1">
              Configured: {Math.floor(configuredDuration / 60)}m {configuredDuration % 60}s limit
            </div>
          </div>
        )}
      </div>

      {/* Action Controls */}
      <div className="flex items-center justify-center gap-2 mt-4">
        {isRunning && (
          <button
            type="button"
            onClick={() => sendAction("pause")}
            disabled={actionInProgress}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-subtle disabled:opacity-50 transition-colors"
          >
            <Pause className="w-3.5 h-3.5 fill-current" /> Pause Clock
          </button>
        )}
        {(isPaused || isStopped) && !expired && (
          <button
            type="button"
            onClick={() => sendAction(isStopped ? "start" : "resume")}
            disabled={actionInProgress}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-subtle disabled:opacity-50 transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-current" /> {isStopped ? "Start Match Timer" : "Resume Clock"}
          </button>
        )}
        <button
          type="button"
          onClick={() => sendAction("reset")}
          disabled={actionInProgress}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-border bg-white text-xs font-semibold text-slate-700 hover:text-primary hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-subtle"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset Duration
        </button>
      </div>
    </div>
  );
}
