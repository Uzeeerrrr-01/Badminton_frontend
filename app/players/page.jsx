"use client";

import { useState, useEffect } from "react";
import PublicNavbar from "@/components/PublicNavbar";
import PublicFooter from "@/components/PublicFooter";
import { Search, Filter, Trophy, Users, ShieldCheck } from "lucide-react";

export default function PlayersDirectoryPage() {
  const [players, setPlayers] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/players").then((r) => r.json()),
      fetch("/api/points").then((r) => r.json()),
    ])
      .then(([pData, ptData]) => {
        setPlayers(pData.players || []);
        setLeaderboard(ptData.leaderboard || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const categories = [
    "Men's Singles",
    "Women's Singles",
    "Men's Doubles",
    "Women's Doubles",
    "Mixed Doubles",
  ];

  const filteredPlayers = players.filter((p) => {
    if (search) {
      const q = search.toLowerCase();
      const matchName = p.full_name.toLowerCase().includes(q);
      const matchId = p.player_id.toLowerCase().includes(q);
      if (!matchName && !matchId) return false;
    }
    if (genderFilter && p.gender !== genderFilter) return false;
    if (categoryFilter && !p.eligible_categories.includes(categoryFilter)) return false;
    return true;
  });

  // Calculate player stats from leaderboard
  const getPlayerStats = (playerId) => {
    const records = leaderboard.filter((item) => item.entity_id === playerId);
    const played = records.reduce((s, r) => s + (r.matches_played || 0), 0);
    const won = records.reduce((s, r) => s + (r.matches_won || 0), 0);
    const points = records.reduce((s, r) => s + (r.total_tournament_points || 0), 0);
    const winRate = played > 0 ? Math.round((won / played) * 100) : 0;
    return { played, won, points, winRate };
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicNavbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">
            Registered Players
          </h1>
          <p className="text-sm text-muted mt-1">
            Complete roster of tournament competitors, category eligibility, and match records.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 rounded-xl border border-border bg-surface shadow-subtle mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by player name or ID..."
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg text-xs bg-white text-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="text-xs px-3 py-2 border border-border rounded-lg bg-white text-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs px-3 py-2 border border-border rounded-lg bg-white text-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Players Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlayers.length === 0 ? (
            <div className="col-span-full p-12 text-center rounded-2xl border border-dashed border-border bg-surface text-muted text-sm">
              No players found matching your criteria.
            </div>
          ) : (
            filteredPlayers.map((p) => {
              const stats = getPlayerStats(p.id);

              return (
                <div
                  key={p.id}
                  className="p-5 rounded-xl border border-border bg-surface shadow-subtle hover:border-slate-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-primary text-sm shrink-0">
                          {p.full_name
                            .split(" ")
                            .map((w) => w[0])
                            .slice(0, 2)
                            .join("")}
                        </div>
                        <div>
                          <h3 className="font-bold text-primary text-base leading-snug">
                            {p.full_name}
                          </h3>
                          <span className="text-[11px] font-mono font-medium text-muted">
                            {p.player_id}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          p.gender === "Male"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {p.gender}
                      </span>
                    </div>

                    {/* Eligible Categories */}
                    <div className="mb-4">
                      <span className="text-[10px] uppercase font-bold text-muted tracking-wider block mb-1.5">
                        Categories
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {p.eligible_categories.map((c) => (
                          <span
                            key={c}
                            className="text-[11px] font-medium bg-slate-50 border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Player Stats Bar */}
                  <div className="pt-3 border-t border-border/80 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-1.5 rounded-lg bg-slate-50">
                      <span className="text-[10px] text-muted block">Played</span>
                      <span className="font-bold text-primary">{stats.played}</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-slate-50">
                      <span className="text-[10px] text-muted block">Win Rate</span>
                      <span className="font-bold text-emerald-700">{stats.winRate}%</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-slate-50">
                      <span className="text-[10px] text-muted block">Pts</span>
                      <span className="font-bold text-primary">{stats.points}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
