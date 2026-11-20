"use client";

import { isDoublesCategory } from "@/lib/scoringEngine";

export default function CourtVisualizer({ match }) {
  if (!match) return null;

  const isDoubles = isDoublesCategory(match.category);
  const isTeamAServing = match.serving_team === "A";

  const posA = match.team_a_positions || {};
  const posB = match.team_b_positions || {};

  const getPlayerName = (id, fallback) => {
    if (!id) return fallback || "Empty";
    if (match.team_a_player1_id === id) return match.team_a_player1?.full_name || match.team_a_name.split("/")[0]?.trim();
    if (match.team_a_player2_id === id) return match.team_a_player2?.full_name || match.team_a_name.split("/")[1]?.trim();
    if (match.team_b_player1_id === id) return match.team_b_player1?.full_name || match.team_b_name.split("/")[0]?.trim();
    if (match.team_b_player2_id === id) return match.team_b_player2?.full_name || match.team_b_name.split("/")[1]?.trim();
    return fallback || "Player";
  };

  const nameARight = getPlayerName(posA.right, match.team_a_name);
  const nameALeft = getPlayerName(posA.left, isDoubles ? "Partner A" : "");
  const nameBRight = getPlayerName(posB.right, match.team_b_name);
  const nameBLeft = getPlayerName(posB.left, isDoubles ? "Partner B" : "");

  return (
    <div className="w-full bg-white rounded-2xl p-5 border border-border shadow-subtle">
      <div className="flex flex-wrap items-center justify-between text-xs text-secondary mb-3 gap-2">
        <div className="flex items-center gap-2">
          <span className="font-heading font-bold text-primary">Live 2D Court Visualizer</span>
          <span>•</span>
          <span className="capitalize font-semibold text-accent">{match.category}</span>
          <span>•</span>
          <span className="text-muted">{isDoubles ? "13.40m × 6.10m (Doubles)" : "13.40m × 5.18m (Singles)"}</span>
        </div>
        <div className="flex items-center gap-3 font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-xs"></span>
            <span className="text-primary">Server ({match.service_court || "right"} court)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block shadow-xs"></span>
            <span className="text-secondary">Receiver</span>
          </div>
        </div>
      </div>

      {/* Badminton Court Rendering (Olympic Tournament Green) */}
      <div className="relative w-full aspect-[21/9] bg-emerald-700 rounded-xl border-4 border-emerald-800 overflow-hidden shadow-inner flex">
        {/* Outer Singles sidelines indicator if singles */}
        {!isDoubles && (
          <>
            <div className="absolute top-0 bottom-0 left-0 w-full h-[8%] border-b border-white/60 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-full h-[8%] border-t border-white/60 pointer-events-none"></div>
          </>
        )}

        {/* LEFT COURT HALF (Team A) */}
        <div className="relative w-1/2 h-full border-r-2 border-white flex flex-col">
          {/* Back doubles service line */}
          <div className="absolute top-0 bottom-0 left-[7%] w-0.5 bg-white/70"></div>
          {/* Short service line */}
          <div className="absolute top-0 bottom-0 right-[18%] w-0.5 bg-white"></div>
          {/* Center line dividing Left and Right service courts */}
          <div className="absolute top-1/2 left-[7%] right-[18%] h-0.5 bg-white"></div>

          {/* Court Team Label */}
          <div className="absolute top-2 left-3 z-10">
            <span className="text-[11px] font-extrabold tracking-wide uppercase px-2 py-0.5 rounded bg-black/50 text-white backdrop-blur-xs border border-white/20">
              {match.team_a_name} (Side A)
            </span>
          </div>

          {/* Left Service Box (Top half from umpire view) */}
          <div
            className={`w-full h-1/2 flex items-center justify-center p-3 relative transition-all ${
              isTeamAServing && match.service_court === "left"
                ? "bg-emerald-400/35 ring-2 ring-inset ring-white"
                : ""
            }`}
          >
            <div className="text-center z-10">
              <span className="text-[10px] text-emerald-100 font-mono tracking-wider font-bold">LEFT COURT</span>
              {nameALeft && (
                <div className="mt-1 flex items-center justify-center gap-1.5">
                  {match.serving_player_id && match.team_a_player2_id === match.serving_player_id && isTeamAServing && (
                    <span className="p-1 rounded-full bg-white text-slate-950 font-bold text-[10px] shadow-sm">🏸</span>
                  )}
                  <span className="text-xs font-bold text-white drop-shadow truncate max-w-[130px]">
                    {nameALeft}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Service Box (Bottom half from umpire view) */}
          <div
            className={`w-full h-1/2 flex items-center justify-center p-3 relative border-t-2 border-white transition-all ${
              isTeamAServing && match.service_court === "right"
                ? "bg-emerald-400/35 ring-2 ring-inset ring-white"
                : ""
            }`}
          >
            <div className="text-center z-10">
              <span className="text-[10px] text-emerald-100 font-mono tracking-wider font-bold">RIGHT COURT</span>
              {nameARight && (
                <div className="mt-1 flex items-center justify-center gap-1.5">
                  {match.serving_player_id && match.team_a_player1_id === match.serving_player_id && isTeamAServing && (
                    <span className="p-1 rounded-full bg-white text-slate-950 font-bold text-[10px] shadow-sm">🏸</span>
                  )}
                  <span className="text-xs font-bold text-white drop-shadow truncate max-w-[130px]">
                    {nameARight}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* NET POST AND NET (Center) */}
        <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-1.5 bg-slate-200 z-20 flex flex-col items-center justify-between shadow-lg">
          <div className="w-3.5 h-3.5 -mt-1 rounded-full bg-slate-900 border-2 border-white shadow-sm" />
          <div className="w-full flex-1 bg-white/90" />
          <div className="w-3.5 h-3.5 -mb-1 rounded-full bg-slate-900 border-2 border-white shadow-sm" />
        </div>

        {/* RIGHT COURT HALF (Team B) */}
        <div className="relative w-1/2 h-full flex flex-col">
          {/* Back doubles service line */}
          <div className="absolute top-0 bottom-0 right-[7%] w-0.5 bg-white/70"></div>
          {/* Short service line */}
          <div className="absolute top-0 bottom-0 left-[18%] w-0.5 bg-white"></div>
          {/* Center line dividing Left and Right service courts */}
          <div className="absolute top-1/2 left-[18%] right-[7%] h-0.5 bg-white"></div>

          {/* Court Team Label */}
          <div className="absolute top-2 right-3 z-10 text-right">
            <span className="text-[11px] font-extrabold tracking-wide uppercase px-2 py-0.5 rounded bg-black/50 text-white backdrop-blur-xs border border-white/20">
              {match.team_b_name} (Side B)
            </span>
          </div>

          {/* Right Service Box (Top half for Side B) */}
          <div
            className={`w-full h-1/2 flex items-center justify-center p-3 relative transition-all ${
              !isTeamAServing && match.service_court === "right"
                ? "bg-emerald-400/35 ring-2 ring-inset ring-white"
                : ""
            }`}
          >
            <div className="text-center z-10">
              <span className="text-[10px] text-emerald-100 font-mono tracking-wider font-bold">RIGHT COURT</span>
              {nameBRight && (
                <div className="mt-1 flex items-center justify-center gap-1.5">
                  {match.serving_player_id && match.team_b_player1_id === match.serving_player_id && !isTeamAServing && (
                    <span className="p-1 rounded-full bg-white text-slate-950 font-bold text-[10px] shadow-sm">🏸</span>
                  )}
                  <span className="text-xs font-bold text-white drop-shadow truncate max-w-[130px]">
                    {nameBRight}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Left Service Box (Bottom half for Side B) */}
          <div
            className={`w-full h-1/2 flex items-center justify-center p-3 relative border-t-2 border-white transition-all ${
              !isTeamAServing && match.service_court === "left"
                ? "bg-emerald-400/35 ring-2 ring-inset ring-white"
                : ""
            }`}
          >
            <div className="text-center z-10">
              <span className="text-[10px] text-emerald-100 font-mono tracking-wider font-bold">LEFT COURT</span>
              {nameBLeft && (
                <div className="mt-1 flex items-center justify-center gap-1.5">
                  {match.serving_player_id && match.team_b_player2_id === match.serving_player_id && !isTeamAServing && (
                    <span className="p-1 rounded-full bg-white text-slate-950 font-bold text-[10px] shadow-sm">🏸</span>
                  )}
                  <span className="text-xs font-bold text-white drop-shadow truncate max-w-[130px]">
                    {nameBLeft}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
