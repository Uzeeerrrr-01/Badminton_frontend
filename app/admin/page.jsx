"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Activity,
  Users,
  UserCheck,
  Calendar,
  Play,
  ArrowRight,
  Trophy,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronRight,
  Timer,
} from "lucide-react";

export default function AdminOverviewPage() {
  const [matches, setMatches] = useState([]);
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      fetch("/api/matches", { cache: "no-store" }).then((r) => (r.ok ? r.json() : {})),
      fetch("/api/players", { cache: "no-store" }).then((r) => (r.ok ? r.json() : {})),
      fetch("/api/teams", { cache: "no-store" }).then((r) => (r.ok ? r.json() : {})),
      fetch("/api/settings", { cache: "no-store" }).then((r) => (r.ok ? r.json() : {})),
    ])
      .then(([mRes, pRes, tRes, sRes]) => {
        const mData = mRes.status === "fulfilled" ? mRes.value || {} : {};
        const pData = pRes.status === "fulfilled" ? pRes.value || {} : {};
        const tData = tRes.status === "fulfilled" ? tRes.value || {} : {};
        const sData = sRes.status === "fulfilled" ? sRes.value || {} : {};

        setMatches(mData.matches || (Array.isArray(mData) ? mData : []));
        setPlayers(pData.players || (Array.isArray(pData) ? pData : []));
        setTeams(tData.teams || (Array.isArray(tData) ? tData : []));
        setSettings(sData.settings || null);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const liveMatches = matches.filter((m) => m.status === "live" || m.status === "tied");
  const upcomingMatches = matches.filter((m) => m.status === "scheduled" || m.status === "ready");
  const completedMatches = matches.filter((m) => m.status === "completed");

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
            ADMIN COMMAND CENTER
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-black text-primary tracking-tight">
            Tournament Overview
          </h1>
          <p className="text-xs text-muted mt-1">
            {settings?.name || "Apex Badminton Open 2026"} • {settings?.venue || "Grand Court Arena"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/matches"
            className="px-4 py-2.5 rounded-xl border border-border bg-white text-xs font-semibold text-primary hover:bg-slate-50 transition-colors shadow-subtle"
          >
            Schedule Fixture
          </Link>
          <Link
            href="/admin/scoring"
            className="px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-secondary transition-colors shadow-subtle flex items-center gap-2"
          >
            <Activity className="w-3.5 h-3.5 text-teal-400" />
            Live Scoring Screen
          </Link>
        </div>
      </div>

      {/* Useful High-Level Metrics (Strictly Useful) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-5 rounded-2xl border border-border bg-white shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted text-xs mb-3">
            <span className="font-semibold text-slate-600">Courts In Action</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-heading font-black text-primary">{liveMatches.length}</div>
            <div className="text-[11px] text-muted font-medium mt-1">
              {settings?.number_of_courts || 4} Total courts available
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-5 rounded-2xl border border-border bg-white shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted text-xs mb-3">
            <span className="font-semibold text-slate-600">Registered Players</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-heading font-black text-primary">{players.length}</div>
            <div className="text-[11px] text-muted font-medium mt-1">Eligible competitors</div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-5 rounded-2xl border border-border bg-white shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted text-xs mb-3">
            <span className="font-semibold text-slate-600">Doubles Partnerships</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-heading font-black text-primary">{teams.length}</div>
            <div className="text-[11px] text-muted font-medium mt-1">Configured teams</div>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-5 rounded-2xl border border-border bg-white shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted text-xs mb-3">
            <span className="font-semibold text-slate-600">Completed Fixtures</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-heading font-black text-primary">{completedMatches.length}</div>
            <div className="text-[11px] text-muted font-medium mt-1">{upcomingMatches.length} Upcoming in draw</div>
          </div>
        </div>
      </div>

      {/* Live Court Matches Section */}
      <div>
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-ping"></span>
            <h2 className="text-base font-heading font-bold text-primary">Live Court Matches</h2>
          </div>
          <Link
            href="/admin/scoring"
            className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1 transition-colors"
          >
            Open Scoring Console <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {liveMatches.length === 0 ? (
          <div className="p-8 rounded-2xl border border-dashed border-border bg-white text-center text-xs text-muted shadow-subtle">
            No matches are live on court right now. Go to Matches to launch a scheduled fixture with pre-match toss.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {liveMatches.map((m) => (
              <div
                key={m.id}
                className="p-5 rounded-2xl border border-teal-200 bg-white shadow-subtle relative overflow-hidden"
              >
                <div className="flex items-center justify-between text-xs text-muted mb-3 font-medium">
                  <span className="bg-teal-50 text-teal-800 border border-teal-200 px-2.5 py-0.5 rounded-full font-bold text-[11px] inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span>
                    Court {m.court_number} • LIVE
                  </span>
                  <span className="font-semibold text-slate-700">{m.category}</span>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div className="min-w-0 pr-2 flex-1">
                    <p className="font-heading font-bold text-primary text-sm truncate">{m.team_a_name}</p>
                    {m.serving_team === "A" && (
                      <span className="text-[10px] text-teal-700 font-bold inline-block mt-0.5">
                        ▶ Serving ({m.service_court || "right"})
                      </span>
                    )}
                  </div>

                  <div className="px-4 py-1.5 bg-slate-100 rounded-xl font-heading font-black text-2xl text-primary shrink-0 tabular-nums">
                    {m.score_a} : {m.score_b}
                  </div>

                  <div className="min-w-0 pl-2 text-right flex-1">
                    <p className="font-heading font-bold text-primary text-sm truncate">{m.team_b_name}</p>
                    {m.serving_team === "B" && (
                      <span className="text-[10px] text-teal-700 font-bold inline-block mt-0.5">
                        ▶ Serving ({m.service_court || "right"})
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                  {m.timer_enabled && m.timer_duration_seconds > 0 ? (
                    <span className="text-[11px] text-muted flex items-center gap-1">
                      <Timer className="w-3.5 h-3.5 text-slate-400" />
                      {m.timer_duration_seconds >= 60
                        ? `${Math.floor(m.timer_duration_seconds / 60)}m${m.timer_duration_seconds % 60 ? ` ${m.timer_duration_seconds % 60}s` : ""} timed`
                        : `${m.timer_duration_seconds}s timed`}
                    </span>
                  ) : (
                    <span className="text-[11px] text-muted">Standard 11-pt rally</span>
                  )}

                  <Link
                    href={`/admin/scoring/${m.id}`}
                    className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-subtle"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    Score Console
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Scheduled & Ready Matches */}
      <div>
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
          <h2 className="text-base font-heading font-bold text-primary">Scheduled Tournament Fixtures</h2>
          <Link
            href="/admin/matches"
            className="text-xs font-semibold text-teal-700 hover:text-teal-800 flex items-center gap-1 transition-colors"
          >
            Manage All Fixtures <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-border shadow-subtle overflow-hidden">
          <div className="divide-y divide-border">
            {upcomingMatches.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted">
                No scheduled matches pending in the current round draw.
              </div>
            ) : (
              upcomingMatches.slice(0, 5).map((m) => (
                <div key={m.id} className="p-4 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <span className="w-20 text-center py-1 rounded-lg bg-slate-100 font-bold text-primary text-[11px]">
                      Court {m.court_number}
                    </span>
                    <div>
                      <div className="font-heading font-bold text-primary text-sm">
                        {m.team_a_name} <span className="text-muted font-normal text-xs px-1">vs</span> {m.team_b_name}
                      </div>
                      <div className="text-muted text-[11px] mt-0.5">
                        {m.category} • {m.round}
                        {m.timer_enabled && m.timer_duration_seconds > 0 && (
                          <span className="ml-2 text-slate-500 font-medium">
                            • {m.timer_duration_seconds >= 60 ? `${Math.floor(m.timer_duration_seconds / 60)}m` : `${m.timer_duration_seconds}s`} Timer
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/admin/scoring/${m.id}`}
                    className="px-3.5 py-1.5 rounded-xl border border-border bg-white hover:bg-slate-50 hover:border-slate-300 text-xs font-bold text-primary transition-colors shadow-subtle"
                  >
                    Start Toss
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}