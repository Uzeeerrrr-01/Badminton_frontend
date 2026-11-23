"use client";

import { useState } from "react";
import { Trophy, ChevronRight, Award, Calendar } from "lucide-react";

export default function BracketView({ matches }) {
  const rounds = ["Quarter-finals", "Semi-finals", "Final"];
  const [activeRound, setActiveRound] = useState("Quarter-finals");

  const matchesByRound = rounds.reduce((acc, r) => {
    acc[r] = (matches || []).filter((m) => m.round === r);
    return acc;
  }, {});

  const renderMatchCard = (m) => {
    const isCompleted = m.status === "completed";
    const isLive = m.status === "live";

    return (
      <div
        key={m.id}
        className={`p-3.5 rounded-xl border bg-white text-xs shadow-subtle transition-all duration-150 ${
          isLive
            ? "border-accent ring-2 ring-accent/15"
            : isCompleted
            ? "border-border hover:border-slate-300"
            : "border-border/90"
        }`}
      >
        <div className="flex items-center justify-between text-[11px] text-muted mb-2 font-medium">
          <span className="font-semibold text-slate-700">
            Court {m.court_number} • {m.category}
          </span>
          {isLive && (
            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-accent bg-accent-light px-2 py-0.5 rounded-full border border-accent-border">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
              LIVE
            </span>
          )}
          {isCompleted && (
            <span className="text-slate-500 font-medium text-[10px] bg-slate-100 px-2 py-0.5 rounded">
              Final
            </span>
          )}
        </div>

        {/* Participant A */}
        <div
          className={`flex items-center justify-between py-1.5 px-2.5 rounded-lg transition-colors ${
            m.winner_team === "A"
              ? "bg-accent-light text-accent font-black border border-accent-border/60"
              : "text-primary"
          }`}
        >
          <span className="truncate pr-2 font-medium">{m.team_a_name}</span>
          <span className="font-mono font-bold text-sm shrink-0">
            {m.score_a}
          </span>
        </div>

        {/* Participant B */}
        <div
          className={`flex items-center justify-between py-1.5 px-2.5 rounded-lg mt-1 transition-colors ${
            m.winner_team === "B"
              ? "bg-accent-light text-accent font-black border border-accent-border/60"
              : "text-primary"
          }`}
        >
          <span className="truncate pr-2 font-medium">{m.team_b_name}</span>
          <span className="font-mono font-bold text-sm shrink-0">
            {m.score_b}
          </span>
        </div>
      </div>
    );
  };

  const mobileMatches = matchesByRound[activeRound] || [];

  return (
    <div className="w-full">
      {/* Mobile View: Clean Round Selector Tabs (Zero Side-Scrolling!) */}
      <div className="sm:hidden space-y-4">
        {/* Round Switcher Tabs */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl border border-border">
          {rounds.map((roundName) => {
            const count = (matchesByRound[roundName] || []).length;
            const isSelected = activeRound === roundName;
            const shortName = roundName.replace("-finals", "s").replace("Final", "Final");

            return (
              <button
                key={roundName}
                type="button"
                onClick={() => setActiveRound(roundName)}
                className={`py-2 px-1 rounded-lg text-xs font-bold transition-all text-center flex flex-col items-center justify-center ${
                  isSelected
                    ? "bg-white text-primary shadow-xs font-black"
                    : "text-secondary hover:text-primary"
                }`}
              >
                <span>{shortName}</span>
                <span className="text-[10px] text-muted font-normal">
                  {count} {count === 1 ? "match" : "matches"}
                </span>
              </button>
            );
          })}
        </div>

        {/* Fixtures for the active round */}
        <div className="space-y-3">
          {mobileMatches.length === 0 ? (
            <div className="p-8 rounded-xl border border-dashed border-border bg-slate-50/50 text-center text-xs text-muted">
              Fixtures pending results of earlier rounds
            </div>
          ) : (
            mobileMatches.map((m) => renderMatchCard(m))
          )}
        </div>
      </div>

      {/* Desktop View: Full 3-Column Tree (>= 640px) */}
      <div className="hidden sm:grid sm:grid-cols-3 gap-6 items-start">
        {rounds.map((roundName) => {
          const roundMatches = matchesByRound[roundName] || [];

          return (
            <div key={roundName} className="space-y-4">
              <div className="text-center pb-2.5 border-b border-border">
                <span className="text-xs font-heading font-black text-primary uppercase tracking-wider block">
                  {roundName}
                </span>
                <span className="text-[11px] text-muted font-medium">
                  {roundMatches.length} {roundMatches.length === 1 ? "Fixture" : "Fixtures"}
                </span>
              </div>

              <div className="space-y-3">
                {roundMatches.length === 0 ? (
                  <div className="p-6 rounded-xl border border-dashed border-border bg-slate-50/50 text-center text-xs text-muted">
                    Fixtures pending earlier rounds
                  </div>
                ) : (
                  roundMatches.map((m) => renderMatchCard(m))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
