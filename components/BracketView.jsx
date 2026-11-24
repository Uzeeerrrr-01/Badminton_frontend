"use client";

import { useState, useEffect } from "react";
import { Trophy, ChevronRight, Award, Calendar, CheckCircle2, Crown, Sparkles } from "lucide-react";

const CATEGORIES = [
  "Men's Singles",
  "Women's Singles",
  "Men's Doubles",
  "Women's Doubles",
  "Mixed Doubles",
];

export default function BracketView({ matches = [], initialCategory = "Men's Singles" }) {
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [bracketData, setBracketData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeRoundName, setActiveRoundName] = useState("");

  // Fetch bracket from dedicated API
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetch(`/api/rounds/category/${encodeURIComponent(selectedCategory)}/bracket`, {
      cache: "no-store",
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted) return;
        if (data && data.rounds && data.rounds.length > 0) {
          setBracketData(data);
          setActiveRoundName(data.rounds[0]?.roundName || "");
        } else {
          // Fallback: Build bracket dynamically from matches prop
          setBracketData(null);
        }
      })
      .catch(() => {
        if (isMounted) setBracketData(null);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedCategory]);

  // If API bracket data is available, use it; otherwise build from matches prop
  let rounds = [];
  let champion = null;

  if (bracketData && bracketData.rounds && bracketData.rounds.length > 0) {
    rounds = bracketData.rounds;
    champion = bracketData.champion;
  } else {
    // Fallback: group matches matching selectedCategory
    const catMatches = (matches || []).filter(
      (m) => !selectedCategory || m.category === selectedCategory
    );
    const discoveredRounds = Array.from(new Set(catMatches.map((m) => m.round).filter(Boolean)));

    // Standard ordering
    const roundOrder = [
      "Round 1",
      "Round of 32",
      "Round of 16",
      "Round 2",
      "Quarter-finals",
      "Semi-finals",
      "Final",
    ];

    discoveredRounds.sort((a, b) => {
      const idxA = roundOrder.indexOf(a);
      const idxB = roundOrder.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });

    rounds = discoveredRounds.map((rName, idx) => ({
      id: `r-${idx}`,
      roundNumber: idx + 1,
      roundName: rName,
      matches: catMatches.filter((m) => m.round === rName),
      byeTeam: null,
    }));

    const finalMatch = catMatches.find((m) => m.round === "Final" && m.status === "completed");
    if (finalMatch && finalMatch.winner_name) {
      champion = {
        name: finalMatch.winner_name,
        finalScore: `${finalMatch.score_a} - ${finalMatch.score_b}`,
        category: selectedCategory,
      };
    }
  }

  // Active round for mobile view
  const currentMobileRound = rounds.find((r) => r.roundName === activeRoundName) || rounds[0] || null;

  const renderMatchCard = (m) => {
    const isCompleted = m.status === "completed";
    const isLive = m.status === "live" || m.status === "tied";

    return (
      <div
        key={m.id}
        className={`p-3.5 rounded-2xl border bg-white text-xs shadow-subtle transition-all duration-150 ${
          isLive
            ? "border-accent ring-2 ring-accent/15"
            : isCompleted
            ? "border-border hover:border-slate-300"
            : "border-border/90"
        }`}
      >
        <div className="flex items-center justify-between text-[11px] text-muted mb-2 font-medium">
          <span className="font-semibold text-slate-700">
            Court {m.court_number} • {m.category || selectedCategory}
          </span>
          {isLive && (
            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-accent bg-accent-light px-2 py-0.5 rounded-full border border-accent-border">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
              LIVE
            </span>
          )}
          {isCompleted && (
            <span className="text-emerald-700 font-extrabold text-[10px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Final
            </span>
          )}
          {!isLive && !isCompleted && (
            <span className="text-slate-500 font-medium text-[10px] bg-slate-100 px-2 py-0.5 rounded">
              Upcoming
            </span>
          )}
        </div>

        {/* Participant A */}
        <div
          className={`flex items-center justify-between py-1.5 px-2.5 rounded-lg transition-colors ${
            m.winner_team === "A"
              ? "bg-accent-light text-accent font-black border border-accent-border/60"
              : "text-primary font-medium"
          }`}
        >
          <span className="truncate pr-2">{m.team_a_name}</span>
          <span className="font-mono font-bold text-sm shrink-0">
            {m.score_a}
          </span>
        </div>

        {/* Participant B */}
        <div
          className={`flex items-center justify-between py-1.5 px-2.5 rounded-lg mt-1 transition-colors ${
            m.winner_team === "B"
              ? "bg-accent-light text-accent font-black border border-accent-border/60"
              : "text-primary font-medium"
          }`}
        >
          <span className="truncate pr-2">{m.team_b_name}</span>
          <span className="font-mono font-bold text-sm shrink-0">
            {m.score_b}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full space-y-6">
      {/* Category Switcher Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setSelectedCategory(cat);
                setBracketData(null);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                isSelected
                  ? "bg-primary text-white shadow-subtle font-black"
                  : "text-secondary hover:text-primary hover:bg-slate-100 bg-white border border-border"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Champion Banner */}
      {champion && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-50 to-emerald-50 border border-amber-300 shadow-card flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-md shadow-amber-500/20 shrink-0">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider block">
                Official Category Champion
              </span>
              <span className="text-base sm:text-lg font-heading font-black text-primary">
                🏆 {champion.name}
              </span>
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-800 bg-emerald-100/70 border border-emerald-200 px-3 py-1 rounded-xl shrink-0">
            Winner ({champion.finalScore})
          </span>
        </div>
      )}

      {/* Empty State */}
      {rounds.length === 0 ? (
        <div className="p-10 rounded-2xl border border-dashed border-border bg-slate-50/50 text-center text-xs text-muted">
          Draw pending for {selectedCategory}. Official fixtures will appear here once published by the tournament director.
        </div>
      ) : (
        <>
          {/* Mobile View: Round Selector Tabs */}
          <div className="sm:hidden space-y-4">
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-border overflow-x-auto no-scrollbar">
              {rounds.map((round) => {
                const count = (round.matches || []).length;
                const isSelected = (currentMobileRound?.roundName || rounds[0]?.roundName) === round.roundName;

                return (
                  <button
                    key={round.id || round.roundName}
                    type="button"
                    onClick={() => setActiveRoundName(round.roundName)}
                    className={`py-2 px-3 rounded-lg text-xs font-bold transition-all text-center shrink-0 ${
                      isSelected
                        ? "bg-white text-primary shadow-xs font-black"
                        : "text-secondary hover:text-primary"
                    }`}
                  >
                    <span>{round.roundName}</span>
                    <span className="text-[10px] text-muted font-normal block">
                      {count} {count === 1 ? "match" : "matches"}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Mobile Round Details */}
            {currentMobileRound && (
              <div className="space-y-3">
                {currentMobileRound.byeTeam && (
                  <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-xs shadow-xs">
                    <span className="text-[10px] font-extrabold text-teal-800 uppercase block">
                      ★ BYE ADVANCED TO NEXT ROUND
                    </span>
                    <span className="font-bold text-primary truncate block mt-0.5">
                      {currentMobileRound.byeTeam.name}
                    </span>
                  </div>
                )}

                {currentMobileRound.matches.length === 0 ? (
                  <div className="p-8 rounded-xl border border-dashed border-border bg-slate-50/50 text-center text-xs text-muted">
                    Fixtures pending results of earlier rounds
                  </div>
                ) : (
                  currentMobileRound.matches.map((m) => renderMatchCard(m))
                )}
              </div>
            )}
          </div>

          {/* Desktop View: Multi-Column Tree */}
          <div
            className={`hidden sm:grid gap-6 items-start ${
              rounds.length === 1
                ? "grid-cols-1 max-w-md mx-auto"
                : rounds.length === 2
                ? "grid-cols-2"
                : rounds.length === 3
                ? "grid-cols-3"
                : "grid-cols-4"
            }`}
          >
            {rounds.map((round) => {
              const rMatches = round.matches || [];

              return (
                <div key={round.id || round.roundName} className="space-y-3">
                  <div className="text-center pb-2.5 border-b border-border">
                    <span className="text-xs font-heading font-black text-primary uppercase tracking-wider block">
                      {round.roundName}
                    </span>
                    <span className="text-[11px] text-muted font-medium">
                      {rMatches.length} {rMatches.length === 1 ? "Fixture" : "Fixtures"}
                    </span>
                  </div>

                  {/* Bye Card in desktop column */}
                  {round.byeTeam && (
                    <div className="p-3 rounded-2xl bg-teal-50 border border-teal-200 text-xs shadow-xs">
                      <div className="text-[10px] font-extrabold text-teal-800 uppercase flex items-center gap-1">
                        <Award className="w-3.5 h-3.5" />
                        <span>BYE ADVANCEMENT</span>
                      </div>
                      <div className="font-bold text-primary truncate mt-1">
                        {round.byeTeam.name}
                      </div>
                      <div className="text-[10px] text-muted mt-0.5">
                        Advances automatically
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    {rMatches.length === 0 ? (
                      <div className="p-6 rounded-xl border border-dashed border-border bg-slate-50/50 text-center text-xs text-muted">
                        Fixtures pending earlier rounds
                      </div>
                    ) : (
                      rMatches.map((m) => renderMatchCard(m))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
