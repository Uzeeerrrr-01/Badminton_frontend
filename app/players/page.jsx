"use client";

import { useState, useEffect } from "react";
import PublicNavbar from "@/components/PublicNavbar";
import PublicFooter from "@/components/PublicFooter";
import {
  Search,
  Filter,
  Trophy,
  Users,
  ShieldCheck,
  Mail,
  MapPin,
  Award,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

export default function PlayersDirectoryPage() {
  const [players, setPlayers] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12; // 3 columns x 4 rows

  useEffect(() => {
    Promise.allSettled([
      fetch("/api/players", { cache: "no-store" }).then((r) => (r.ok ? r.json() : {})),
      fetch("/api/points", { cache: "no-store" }).then((r) => (r.ok ? r.json() : {})),
    ])
      .then(([pRes, ptRes]) => {
        const pData = pRes.status === "fulfilled" ? pRes.value || {} : {};
        const ptData = ptRes.status === "fulfilled" ? ptRes.value || {} : {};
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

  useEffect(() => {
    setCurrentPage(1);
  }, [search, genderFilter, categoryFilter]);

  const filteredPlayers = players.filter((p) => {
    if (search) {
      const q = search.toLowerCase();
      const matchName = (p.full_name || "").toLowerCase().includes(q);
      const matchId = (p.player_id || "").toLowerCase().includes(q);
      const matchDept = (p.contact_phone || "").toLowerCase().includes(q);
      if (!matchName && !matchId && !matchDept) return false;
    }
    if (genderFilter && p.gender !== genderFilter) return false;
    if (categoryFilter && (!p.eligible_categories || !p.eligible_categories.includes(categoryFilter))) return false;
    return true;
  });

  // Pagination calculations
  const totalItems = filteredPlayers.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedPlayers = filteredPlayers.slice(startIndex, endIndex);

  const getPageNumbers = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (safeCurrentPage <= 4) return [1, 2, 3, 4, 5, "...", totalPages];
    if (safeCurrentPage >= totalPages - 3) return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, "...", safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1, "...", totalPages];
  };

  // Calculate player stats from leaderboard
  const getPlayerStats = (playerId) => {
    const records = leaderboard.filter((item) => item.entity_id === playerId);
    const played = records.reduce((s, r) => s + (r.matches_played || 0), 0);
    const won = records.reduce((s, r) => s + (r.matches_won || 0), 0);
    const points = records.reduce(
      (s, r) => s + (r.total_tournament_points || 0),
      0,
    );
    const winRate = played > 0 ? Math.round((won / played) * 100) : 0;
    return { played, won, points, winRate };
  };

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-accent-light selection:text-accent">
      <PublicNavbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-accent-light text-accent border border-accent-border mb-3">
            <Users className="w-3.5 h-3.5" />
            <span>OFFICIAL COMPETITOR ROSTER • {players.length} ATHLETES</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-heading font-black text-primary tracking-tight">
            Registered Athletes & Competitors
          </h1>
          <p className="text-sm text-secondary mt-1 max-w-2xl">
            Official profiles of all participating players, category eligibility, department affiliations, and match performance stats.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-3.5 sm:p-4 rounded-2xl border border-border bg-white shadow-subtle mb-6 sm:mb-8 flex flex-col md:flex-row gap-3 sm:gap-4 items-stretch md:items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by player name, ID or department..."
              className="w-full pl-10 pr-4 py-2 border border-border rounded-xl text-xs bg-slate-50 text-primary font-medium focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all placeholder:text-muted"
            />
          </div>

          <div className="grid grid-cols-2 xs:flex items-center gap-2 sm:gap-3 w-full md:w-auto">
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="text-xs px-3 sm:px-3.5 py-2 border border-border rounded-xl bg-slate-50 text-primary font-semibold focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors w-full xs:w-auto"
            >
              <option value="">All Genders</option>
              <option value="Male">Male Athletes</option>
              <option value="Female">Female Athletes</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs px-3 sm:px-3.5 py-2 border border-border rounded-xl bg-slate-50 text-primary font-semibold focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors w-full xs:w-auto"
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredPlayers.length === 0 ? (
            <div className="col-span-full p-10 sm:p-16 text-center rounded-2xl border border-dashed border-border bg-white shadow-subtle">
              <div className="w-12 h-12 rounded-full bg-slate-100 mx-auto flex items-center justify-center mb-3">
                <Users className="w-6 h-6 text-slate-400" />
              </div>
              <h3 className="font-heading font-black text-primary text-base">No Competitors Found</h3>
              <p className="text-xs text-muted max-w-sm mx-auto mt-1">
                No players match your search filter criteria. Try clearing the search or category filter.
              </p>
            </div>
          ) : (
            paginatedPlayers.map((p) => {
              const stats = getPlayerStats(p.id);
              const deptName = p.contact_phone ? p.contact_phone.replace("Dept: ", "") : null;

              return (
                <div
                  key={p.id}
                  className="p-4 sm:p-6 rounded-2xl border border-border bg-white shadow-card hover:shadow-elevated hover:border-slate-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Header: Monogram Avatar + Name + Gender badge */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-accent-light text-accent border border-accent-border flex items-center justify-center font-heading font-black text-base shadow-subtle shrink-0">
                          {p.full_name
                            .split(" ")
                            .map((w) => w[0])
                            .slice(0, 2)
                            .join("")}
                        </div>
                        <div>
                          <h3 className="font-heading font-black text-primary text-base leading-snug">
                            {p.full_name}
                          </h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] font-mono font-bold text-accent bg-accent-light px-1.5 py-0.2 rounded">
                              {p.player_id}
                            </span>
                            {deptName && (
                              <span className="text-[11px] text-muted truncate max-w-[140px]">
                                {deptName}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0 ${
                          p.gender === "Female"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}
                      >
                        {p.gender}
                      </span>
                    </div>

                    {/* Eligible Categories */}
                    <div className="mb-4">
                      <span className="text-[10px] uppercase font-bold text-muted tracking-wider block mb-1.5">
                        Registered Events
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {p.eligible_categories.map((c) => (
                          <span
                            key={c}
                            className="text-[11px] font-semibold bg-slate-50 border border-slate-200 text-slate-700 px-2.5 py-0.5 rounded-lg"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Player Stats Bar */}
                  <div className="pt-3.5 border-t border-border grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 rounded-xl bg-slate-50 border border-border/60">
                      <span className="text-[10px] font-bold text-muted uppercase block">
                        Played
                      </span>
                      <span className="font-heading font-black text-primary text-sm">
                        {stats.played}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 border border-border/60">
                      <span className="text-[10px] font-bold text-muted uppercase block">
                        Won
                      </span>
                      <span className="font-heading font-black text-accent text-sm">
                        {stats.won}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 border border-border/60">
                      <span className="text-[10px] font-bold text-muted uppercase block">
                        Win Rate
                      </span>
                      <span className="font-heading font-black text-primary text-sm">
                        {stats.winRate}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Public Pagination Bar */}
        {filteredPlayers.length > 0 && totalPages > 1 && (
          <div className="mt-8 sm:mt-10 p-3.5 sm:p-4 rounded-2xl border border-border bg-white shadow-subtle flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-xs text-secondary">
            <div className="text-center sm:text-left text-[11px] sm:text-xs">
              Showing <span className="font-bold text-primary">{startIndex + 1}</span> to{" "}
              <span className="font-bold text-primary">{endIndex}</span> of{" "}
              <span className="font-bold text-primary">{totalItems}</span> athletes
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={safeCurrentPage <= 1}
                className="p-1.5 sm:p-2 rounded-xl border border-border bg-white text-primary hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="First Page"
              >
                <ChevronsLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safeCurrentPage <= 1}
                className="p-1.5 sm:p-2 rounded-xl border border-border bg-white text-primary hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Previous Page"
              >
                <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>

              <div className="flex items-center gap-1 px-1">
                {getPageNumbers().map((page, idx) =>
                  page === "..." ? (
                    <span key={`dots-${idx}`} className="px-1.5 text-muted text-xs select-none">
                      ...
                    </span>
                  ) : (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`min-w-7 sm:min-w-8 h-7 sm:h-8 px-2 sm:px-2.5 rounded-xl text-xs font-bold transition-all ${
                        page === safeCurrentPage
                          ? "bg-primary text-white shadow-subtle"
                          : "bg-white border border-border text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage >= totalPages}
                className="p-1.5 sm:p-2 rounded-xl border border-border bg-white text-primary hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Next Page"
              >
                <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={safeCurrentPage >= totalPages}
                className="p-1.5 sm:p-2 rounded-xl border border-border bg-white text-primary hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Last Page"
              >
                <ChevronsRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
