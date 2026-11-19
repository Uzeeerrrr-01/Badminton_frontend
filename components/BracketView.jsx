"use client";

import { Trophy, ChevronRight } from "lucide-react";

export default function BracketView({ matches }) {
  const rounds = ["Quarter-finals", "Semi-finals", "Final"];

  const matchesByRound = rounds.reduce((acc, r) => {
    acc[r] = (matches || []).filter((m) => m.round === r);
    return acc;
  }, {});

  return (
    <div className="w-full overflow-x-auto py-6">
      <div className="min-w-[760px] grid grid-cols-3 gap-8 items-center">
        {rounds.map((roundName, rIdx) => {
          const roundMatches = matchesByRound[roundName] || [];

          return (
            <div key={roundName} className="space-y-4">
              <div className="text-center pb-2 border-b border-border">
                <span className="text-xs font-bold text-primary uppercase tracking-wider">
                  {roundName}
                </span>
                <span className="block text-[11px] text-muted">
                  {roundMatches.length} {roundMatches.length === 1 ? "Match" : "Matches"}
                </span>
              </div>

              <div className="space-y-4">
                {roundMatches.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-border text-center text-xs text-muted">
                    Matches pending qualification
                  </div>
                ) : (
                  roundMatches.map((m) => {
                    const isCompleted = m.status === "completed";
                    const isLive = m.status === "live";

                    return (
                      <div
                        key={m.id}
                        className={`p-3.5 rounded-xl border bg-surface text-xs shadow-subtle transition-all ${
                          isLive
                            ? "border-emerald-500 ring-2 ring-emerald-500/10"
                            : isCompleted
                            ? "border-border"
                            : "border-border/80"
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] text-muted mb-2 font-mono">
                          <span>Court {m.court_number} • {m.category}</span>
                          {isLive && (
                            <span className="font-bold text-emerald-600 animate-pulse">
                              LIVE
                            </span>
                          )}
                          {isCompleted && (
                            <span className="text-slate-500 font-medium">Final</span>
                          )}
                        </div>

                        {/* Participant A */}
                        <div
                          className={`flex items-center justify-between py-1.5 px-2 rounded-lg ${
                            m.winner_team === "A"
                              ? "bg-emerald-50 text-emerald-950 font-bold"
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
                          className={`flex items-center justify-between py-1.5 px-2 rounded-lg mt-0.5 ${
                            m.winner_team === "B"
                              ? "bg-emerald-50 text-emerald-950 font-bold"
                              : "text-primary"
                          }`}
                        >
                          <span className="truncate pr-2 font-medium">{m.team_b_name}</span>
                          <span className="font-mono font-bold text-sm shrink-0">
                            {m.score_b}
                          </span>
                        </div>

                        {m.winner_name && (
                          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold">
                            <Trophy className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">Winner: {m.winner_name}</span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
