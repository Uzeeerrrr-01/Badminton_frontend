"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Activity, Play, CheckCircle2, ChevronRight, Pause, Timer } from "lucide-react";

export default function AdminScoringSelectPage() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/matches")
      .then((r) => r.json())
      .then((d) => setMatches(d.matches || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const liveMatches = matches.filter((m) => m.status === "live" || m.status === "tied");
  const pausedMatches = matches.filter((m) => m.status === "paused");
  const readyMatches = matches.filter((m) => m.status === "ready" || m.status === "scheduled");

  return (
    <div className="space-y-6">
      <div className="pb-6 border-b border-border">
        <h1 className="text-2xl sm:text-3xl font-heading font-black text-primary tracking-tight">
          Live Scoring Terminal
        </h1>
        <p className="text-xs text-muted mt-1">
          Select an active court fixture to launch the distraction-free umpire live scoring console.
        </p>
      </div>

      {/* Live matches */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-ping"></span>
          <h2 className="text-xs font-heading font-bold text-primary uppercase tracking-wider">
            Live In Play ({liveMatches.length})
          </h2>
        </div>

        {liveMatches.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-dashed border-border bg-white text-muted text-xs shadow-subtle">
            No matches are live on court right now.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {liveMatches.map((m) => (
              <Link
                key={m.id}
                href={`/admin/scoring/${m.id}`}
                className="p-5 rounded-2xl border border-teal-300 bg-white shadow-subtle hover:border-teal-500 hover:shadow-card transition-all flex items-center justify-between group"
              >
                <div>
                  <div className="flex items-center gap-2 text-xs text-muted mb-2 font-medium">
                    <span className="bg-teal-50 text-teal-800 border border-teal-200 px-2.5 py-0.5 rounded-full font-bold text-[10px]">
                      Court {m.court_number}
                    </span>
                    <span className="font-semibold text-slate-700">{m.category}</span>
                  </div>
                  <div className="text-sm font-heading font-bold text-primary">
                    {m.team_a_name} <span className="text-teal-700 font-mono font-black text-base px-1">({m.score_a})</span>
                    <span className="text-muted font-normal text-xs px-1">vs</span>
                    {m.team_b_name} <span className="text-teal-700 font-mono font-black text-base px-1">({m.score_b})</span>
                  </div>
                  <div className="text-[11px] text-muted mt-1 flex items-center gap-2">
                    <span>Serving: {m.serving_team === "A" ? m.team_a_name : m.team_b_name} ({m.service_court || "right"} court)</span>
                    {m.timer_enabled && m.timer_duration_seconds > 0 && (
                      <span className="inline-flex items-center gap-1 text-slate-500 font-medium">
                        • <Timer className="w-3 h-3" /> {Math.floor(m.timer_duration_seconds / 60)}m timed
                      </span>
                    )}
                  </div>
                </div>

                <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-subtle">
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Paused matches */}
      {pausedMatches.length > 0 && (
        <div>
          <h2 className="text-xs font-heading font-bold text-primary uppercase tracking-wider mb-3">
            Paused Matches ({pausedMatches.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pausedMatches.map((m) => (
              <Link
                key={m.id}
                href={`/admin/scoring/${m.id}`}
                className="p-4 rounded-2xl border border-border bg-white hover:border-slate-300 transition-all flex items-center justify-between shadow-subtle"
              >
                <div>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                    Court {m.court_number} • PAUSED
                  </span>
                  <div className="text-xs font-heading font-bold text-primary mt-1.5">
                    {m.team_a_name} ({m.score_a}) vs {m.team_b_name} ({m.score_b})
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Scheduled matches */}
      <div>
        <h2 className="text-xs font-heading font-bold text-primary uppercase tracking-wider mb-3">
          Upcoming Scheduled Fixtures ({readyMatches.length})
        </h2>
        <div className="bg-white rounded-2xl border border-border shadow-subtle divide-y divide-border">
          {readyMatches.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted">
              No scheduled fixtures pending.
            </div>
          ) : (
            readyMatches.map((m) => (
              <div key={m.id} className="p-4 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors">
                <div>
                  <span className="font-bold text-primary mr-2 px-2 py-0.5 rounded-md bg-slate-100 text-[11px]">Court {m.court_number}</span>
                  <span className="text-slate-800 font-bold">{m.team_a_name}</span>
                  <span className="text-muted mx-1.5 font-normal">vs</span>
                  <span className="text-slate-800 font-bold">{m.team_b_name}</span>
                  <span className="text-muted text-[11px] block mt-0.5">
                    {m.category} • {m.round}
                  </span>
                </div>
                <Link
                  href={`/admin/scoring/${m.id}`}
                  className="px-3.5 py-1.5 rounded-xl border border-border hover:border-primary text-xs font-bold text-primary transition-colors bg-white shadow-subtle"
                >
                  Open / Toss
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}