"use client";

import { isDoublesCategory } from "@/lib/scoringEngine";

export default function CourtVisualizer({ match }) {
  if (!match) return null;

  const isDoubles = isDoublesCategory(match.category);
  const isTeamAServing = match.serving_team === "A";

  // Team positions
  // posA: { right: playerId, left: playerId }
  // posB: { right: playerId, left: playerId }
  const posA = match.team_a_positions || {};
  const posB = match.team_b_positions || {};

  // Resolve player names
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
    <div className="w-full bg-slate-900 text-white rounded-xl p-5 shadow-elevated border border-slate-800">
      <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-200">Official Court Layout</span>
          <span>•</span>
          <span className="capitalize">{match.category}</span>
          <span>•</span>
          <span>{isDoubles ? "13.40m × 6.10m (Doubles)" : "13.40m × 5.18m (Singles)"}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            <span className="text-slate-300">Server ({match.service_court} court)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span>
            <span className="text-slate-300">Receiver</span>
          </div>
        </div>
      </div>

      {/* Badminton Court Rendering */}
      <div className="relative w-full aspect-[21/9] bg-emerald-900/90 rounded-lg border-2 border-white/80 overflow-hidden shadow-inner flex">
        {/* Outer Singles sidelines indicator if singles */}
        {!isDoubles && (
          <>
            <div className="absolute top-0 bottom-0 left-0 w-full h-[8%] border-b border-white/40 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-full h-[8%] border-t border-white/40 pointer-events-none"></div>
          </>
        )}

        {/* LEFT COURT HALF (Team A) */}
        <div className="relative w-1/2 h-full border-r-2 border-white/90 flex flex-col">
          {/* Back doubles service line */}
          <div className="absolute top-0 bottom-0 left-[7%] w-px bg-white/40"></div>
          {/* Short service line */}
          <div className="absolute top-0 bottom-0 right-[18%] w-px bg-white/80"></div>
          {/* Center line dividing Left and Right service courts */}
          <div className="absolute top-1/2 left-[7%] right-[18%] h-px bg-white/80"></div>

          {/* Court Team Label */}
          <div className="absolute top-2 left-3 z-10">
            <span className="text-[11px] font-bold tracking-wide uppercase px-2 py-0.5 rounded bg-black/40 text-slate-300 border border-white/10">
              {match.team_a_name} (Side A)
            </span>
          </div>

          {/* Left Service Box (Top half from umpire perspective) */}
          <div
            className={`w-full h-1/2 flex items-center justify-center p-3 relative transition-all ${
              isTeamAServing && match.service_court === "left"
                ? "bg-emerald-500/25 ring-2 ring-inset ring-emerald-400"
                : ""
            }`}
          >
            <div className="text-center z-10">
              <span className="text-[10px] text-emerald-200/60 block font-mono">LEFT SERVICE COURT</span>
              {nameALeft && (
                <div className="mt-1 flex items-center justify-center gap-1.5">
                  {match.serving_player_id && match.team_a_player2_id === match.serving_player_id && isTeamAServing && (
                    <span className="p-1 rounded-full bg-emerald-500 text-slate-950 font-bold text-[10px]">🏸</span>
                  )}
                  <span className="text-xs font-semibold text-white drop-shadow truncate max-w-[130px]">
                    {nameALeft}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Service Box (Bottom half) */}
          <div
            className={`w-full h-1/2 flex items-center justify-center p-3 relative transition-all border-t border-white/30 ${
              isTeamAServing && match.service_court === "right"
                ? "bg-emerald-500/25 ring-2 ring-inset ring-emerald-400"
                : ""
            }`}
          >
            <div className="text-center z-10">
              <span className="text-[10px] text-emerald-200/60 block font-mono">RIGHT SERVICE COURT</span>
              <div className="mt-1 flex items-center justify-center gap-1.5">
                {match.serving_player_id && match.team_a_player1_id === match.serving_player_id && isTeamAServing && (
                  <span className="p-1 rounded-full bg-emerald-500 text-slate-950 font-bold text-[10px]">🏸</span>
                )}
                <span className="text-xs font-semibold text-white drop-shadow truncate max-w-[130px]">
                  {nameARight}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* NET (Center) */}
        <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-1.5 bg-slate-300 z-20 flex flex-col justify-between items-center shadow-lg">
          <div className="w-3 h-3 rounded-full bg-white border border-slate-500 -mt-1"></div>
          <span className="text-[9px] font-bold text-slate-800 rotate-90 select-none bg-white/90 px-1 rounded">
            NET
          </span>
          <div className="w-3 h-3 rounded-full bg-white border border-slate-500 -mb-1"></div>
        </div>

        {/* RIGHT COURT HALF (Team B) */}
        <div className="relative w-1/2 h-full flex flex-col">
          {/* Short service line */}
          <div className="absolute top-0 bottom-0 left-[18%] w-px bg-white/80"></div>
          {/* Back doubles service line */}
          <div className="absolute top-0 bottom-0 right-[7%] w-px bg-white/40"></div>
          {/* Center line dividing Left and Right service courts */}
          <div className="absolute top-1/2 left-[18%] right-[7%] h-px bg-white/80"></div>

          {/* Court Team Label */}
          <div className="absolute top-2 right-3 z-10">
            <span className="text-[11px] font-bold tracking-wide uppercase px-2 py-0.5 rounded bg-black/40 text-slate-300 border border-white/10">
              {match.team_b_name} (Side B)
            </span>
          </div>

          {/* Left Service Box (Top half) */}
          <div
            className={`w-full h-1/2 flex items-center justify-center p-3 relative transition-all ${
              !isTeamAServing && match.service_court === "left"
                ? "bg-emerald-500/25 ring-2 ring-inset ring-emerald-400"
                : ""
            }`}
          >
            <div className="text-center z-10">
              <span className="text-[10px] text-emerald-200/60 block font-mono">LEFT SERVICE COURT</span>
              {nameBLeft && (
                <div className="mt-1 flex items-center justify-center gap-1.5">
                  {match.serving_player_id && match.team_b_player2_id === match.serving_player_id && !isTeamAServing && (
                    <span className="p-1 rounded-full bg-emerald-500 text-slate-950 font-bold text-[10px]">🏸</span>
                  )}
                  <span className="text-xs font-semibold text-white drop-shadow truncate max-w-[130px]">
                    {nameBLeft}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Service Box (Bottom half) */}
          <div
            className={`w-full h-1/2 flex items-center justify-center p-3 relative transition-all border-t border-white/30 ${
              !isTeamAServing && match.service_court === "right"
                ? "bg-emerald-500/25 ring-2 ring-inset ring-emerald-400"
                : ""
            }`}
          >
            <div className="text-center z-10">
              <span className="text-[10px] text-emerald-200/60 block font-mono">RIGHT SERVICE COURT</span>
              <div className="mt-1 flex items-center justify-center gap-1.5">
                {match.serving_player_id && match.team_b_player1_id === match.serving_player_id && !isTeamAServing && (
                  <span className="p-1 rounded-full bg-emerald-500 text-slate-950 font-bold text-[10px]">🏸</span>
                )}
                <span className="text-xs font-semibold text-white drop-shadow truncate max-w-[130px]">
                  {nameBRight}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
