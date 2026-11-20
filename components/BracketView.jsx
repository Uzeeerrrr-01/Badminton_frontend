"use client";

import { Trophy, ChevronRight } from "lucide-react";

export default function BracketView({ matches }) {
  const rounds = ["Quarter-finals", "Semi-finals", "Final"];

  const matchesByRound = rounds.reduce((acc, r) => {
    acc[r] = (matches || []).filter((m) => m.round === r);
    return acc;
  }, {});

  return (
    <div className="w-full overflow-x-auto py-4">
      <div className="min-w-[760px] grid grid-cols-3 gap-6 items-center">
        {rounds.map((roundName, rIdx) => {
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
                  roundMatches.map((m) => {
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
