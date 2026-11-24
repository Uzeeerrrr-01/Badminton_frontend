"use client";

import { useState, useEffect } from "react";
import ConfirmModal from "@/components/ConfirmModal";
import ToastNotification from "@/components/ToastNotification";
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle,
  AlertCircle,
  X,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Sparkles,
} from "lucide-react";

export default function AdminPlayersPage() {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [formData, setFormData] = useState({
    player_id: "",
    full_name: "",
    gender: "Male",
    contact_email: "",
    contact_phone: "",
    registration_status: "Active",
    eligible_categories: ["Men's Singles", "Men's Doubles"],
  });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null, name: "" });
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "info" });

  const allCategories = [
    "Men's Singles",
    "Women's Singles",
    "Men's Doubles",
    "Women's Doubles",
    "Mixed Doubles",
  ];

  const fetchPlayers = async () => {
    try {
      const [pRes, tRes] = await Promise.all([
        fetch("/api/players"),
        fetch("/api/teams"),
      ]);
      const pData = await pRes.json();
      const tData = await tRes.json();
      setPlayers(pData.players || []);
      setTeams(tData.teams || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayers();
  }, []);

  const getPlayerPartnerships = (player) => {
    if (player.partnerships && player.partnerships.length > 0) {
      return player.partnerships;
    }
    if (!teams || teams.length === 0) return [];
    const pId = player.id;
    const pCustomId = player.player_id;
    const pName = (player.full_name || "").toLowerCase().trim();

    const matches = teams.filter((t) => {
      const matchP1 =
        t.player1_id === pId ||
        t.player1_id === pCustomId ||
        (t.player1 && (t.player1.id === pId || t.player1.player_id === pCustomId || (t.player1.full_name && t.player1.full_name.toLowerCase().trim() === pName)));
      const matchP2 =
        t.player2_id === pId ||
        t.player2_id === pCustomId ||
        (t.player2 && (t.player2.id === pId || t.player2.player_id === pCustomId || (t.player2.full_name && t.player2.full_name.toLowerCase().trim() === pName)));
      return matchP1 || matchP2;
    });

    return matches.map((t) => {
      const isP1 =
        t.player1_id === pId ||
        t.player1_id === pCustomId ||
        (t.player1 && (t.player1.id === pId || t.player1.player_id === pCustomId || (t.player1.full_name && t.player1.full_name.toLowerCase().trim() === pName)));
      const partner = isP1 ? t.player2 : t.player1;
      const partnerName = partner?.full_name || (isP1 ? t.player2_id : t.player1_id) || "Partner";
      return {
        category: t.category,
        team_id: t.id,
        team_name: t.name,
        partner_id: isP1 ? t.player2_id : t.player1_id,
        partner_name: partnerName,
      };
    });
  };

  const getNextPlayerId = (playersList = []) => {
    if (!playersList || playersList.length === 0) {
      return "PLY-001";
    }

    let maxNum = 0;
    const existingIds = new Set();
    playersList.forEach((p) => {
      const pid = (p.player_id || "").trim();
      if (pid) {
        existingIds.add(pid.toUpperCase());
        const match = pid.match(/(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxNum) {
            maxNum = num;
          }
        }
      }
    });

    let nextNum = Math.max(playersList.length + 1, maxNum + 1);
    let candidate = `PLY-${String(nextNum).padStart(3, "0")}`;

    while (existingIds.has(candidate.toUpperCase())) {
      nextNum++;
      candidate = `PLY-${String(nextNum).padStart(3, "0")}`;
    }

    return candidate;
  };
  };

  const openCreateModal = () => {
    setEditingPlayer(null);
    const autoId = getNextPlayerId(players);
    setFormData({
      player_id: autoId,
      full_name: "",
      gender: "Male",
      contact_email: "",
      contact_phone: "",
      registration_status: "Active",
      eligible_categories: ["Men's Singles", "Men's Doubles"],
    });
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (player) => {
    setEditingPlayer(player);
    setFormData({
      player_id: player.player_id,
      full_name: player.full_name,
      gender: player.gender,
      contact_email: player.contact_email || "",
      contact_phone: player.contact_phone || "",
      registration_status: player.registration_status || "Active",
      eligible_categories: player.eligible_categories || [],
    });
    setFormError("");
    setModalOpen(true);
  };

  const handleGenderChange = (newGender) => {
    const validCats = formData.eligible_categories.filter((cat) => {
      if (newGender === "Male" && cat.includes("Women's")) return false;
      if (newGender === "Female" && cat.includes("Men's")) return false;
      return true;
    });

    const defaults =
      newGender === "Male"
        ? ["Men's Singles", "Men's Doubles"]
        : ["Women's Singles", "Women's Doubles"];

    setFormData({
      ...formData,
      gender: newGender,
      eligible_categories: validCats.length > 0 ? validCats : defaults,
    });
  };

  const toggleCategory = (cat) => {
    if (formData.gender === "Male" && cat.includes("Women's")) {
      setFormError("A Male competitor cannot be assigned to Women's categories.");
      return;
    }
    if (formData.gender === "Female" && cat.includes("Men's")) {
      setFormError("A Female competitor cannot be assigned to Men's categories.");
      return;
    }

    setFormError("");
    const current = formData.eligible_categories;
    if (current.includes(cat)) {
      setFormData({ ...formData, eligible_categories: current.filter((c) => c !== cat) });
    } else {
      setFormData({ ...formData, eligible_categories: [...current, cat] });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);

    try {
      const url = editingPlayer ? `/api/players/${editingPlayer.id}` : "/api/players";
      const method = editingPlayer ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save player.");
      }

      setModalOpen(false);
      setToast({
        message: editingPlayer
          ? `Competitor "${formData.full_name}" updated successfully.`
          : `Competitor "${formData.full_name}" registered successfully.`,
        type: "success",
      });
      fetchPlayers();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const requestDelete = (id, name) => {
    setDeleteConfirm({ isOpen: true, id, name });
  };

  const handleExecuteDelete = async () => {
    if (!deleteConfirm.id) return;
    setDeleteSubmitting(true);
    try {
      const res = await fetch(`/api/players/${deleteConfirm.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete player.");
      }
      setToast({ message: `Competitor "${deleteConfirm.name}" removed successfully.`, type: "success" });
      setDeleteConfirm({ isOpen: false, id: null, name: "" });
      fetchPlayers();
    } catch (err) {
      setToast({ message: err.message, type: "error" });
    } finally {
      setDeleteSubmitting(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [search, genderFilter, statusFilter, pageSize]);

  const filteredPlayers = players.filter((p) => {
    if (search) {
      const q = search.toLowerCase();
      if (!p.full_name.toLowerCase().includes(q) && !p.player_id.toLowerCase().includes(q)) {
        return false;
      }
    }
    if (genderFilter && p.gender !== genderFilter) return false;
    if (statusFilter && p.registration_status !== statusFilter) return false;
    return true;
  });

  // Pagination calculations
  const totalItems = filteredPlayers.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedPlayers = filteredPlayers.slice(startIndex, endIndex);

  // Generate numbered page buttons with smart windowing
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (safeCurrentPage <= 4) {
      return [1, 2, 3, 4, 5, "...", totalPages];
    }
    if (safeCurrentPage >= totalPages - 3) {
      return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, "...", safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1, "...", totalPages];
  };

  return (
    <>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-black text-primary tracking-tight">
            Player Management
          </h1>
          <p className="text-xs text-muted mt-1">
            Register competitors, configure gender categories, and review tournament eligibility.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-primary hover:bg-secondary text-white text-xs font-bold transition-colors shadow-subtle flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-teal-400" />
          Add Competitor
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="p-4 rounded-2xl border border-border bg-white shadow-subtle flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or player ID..."
            className="w-full pl-9 pr-3 py-2 border border-border rounded-xl text-xs bg-white text-primary focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
            className="text-xs px-3 py-2 border border-border rounded-xl bg-white text-primary focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          >
            <option value="">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-2 border border-border rounded-xl bg-white text-primary focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Withdrawn">Withdrawn</option>
          </select>
        </div>
      </div>

      {/* Players Table */}
      <div className="bg-white rounded-2xl border border-border shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-border text-slate-600 font-heading font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">ID</th>
                <th className="py-3.5 px-4">Player</th>
                <th className="py-3.5 px-4">Gender</th>
                <th className="py-3.5 px-4">Eligible Categories</th>
                <th className="py-3.5 px-4 text-center">Record (P / W / L)</th>
                <th className="py-3.5 px-4 text-center">Tournament Pts</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredPlayers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted">
                    No registered players match the search criteria.
                  </td>
                </tr>
              ) : (
                paginatedPlayers.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-500 text-[11px]">
                      {p.player_id}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-primary">
                      {p.full_name}
                      {p.contact_email && (
                        <span className="block text-[11px] font-normal text-muted">
                          {p.contact_email}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.gender === "Male"
                            ? "bg-slate-100 text-slate-800 border border-slate-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {p.gender}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {(() => {
                        const partnerships = getPlayerPartnerships(p);
                        return (
                          <div className="flex flex-col gap-1.5">
                            {(p.eligible_categories || []).map((cat) => {
                              const ptn = partnerships.find((pt) => pt.category === cat);
                              return (
                                <div key={cat} className="flex items-center gap-1.5 flex-wrap">
                                  <span className="bg-slate-100 text-slate-700 text-[10px] font-medium px-2 py-0.5 rounded-md border border-slate-200/80">
                                    {cat}
                                  </span>
                                  {ptn && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                                      <Users className="w-2.5 h-2.5 text-teal-600" />
                                      <span>w/ {ptn.partner_name}</span>
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-semibold text-primary">{p.matches_played || 0}</span>
                      <span className="text-muted text-[11px] mx-1">/</span>
                      <span className="font-bold text-teal-700">{p.matches_won || 0}W</span>
                      <span className="text-muted text-[11px] mx-1">/</span>
                      <span className="text-muted">{p.matches_lost || 0}L</span>
                      <span className="block text-[10px] text-muted font-medium mt-0.5">
                        {p.win_rate !== undefined ? `${p.win_rate}% win` : (p.matches_played > 0 ? `${Math.round(((p.matches_won || 0) / p.matches_played) * 100)}%` : "0%")}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-teal-700 text-xs">
                      {p.tournament_points || 0} pts
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                        <CheckCircle className="w-3 h-3 text-teal-600" />
                        {p.registration_status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(p)}
                          className="p-1.5 text-muted hover:text-primary hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit Competitor"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => requestDelete(p.id, p.full_name)}
                          className="p-1.5 text-muted hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Remove Competitor"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filteredPlayers.length > 0 && (
          <div className="px-4 py-3.5 border-t border-border bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-secondary">
            {/* Showing Range & Page Size */}
            <div className="flex flex-wrap items-center gap-3">
              <span>
                Showing <span className="font-bold text-primary">{startIndex + 1}</span> to{" "}
                <span className="font-bold text-primary">{endIndex}</span> of{" "}
                <span className="font-bold text-primary">{totalItems}</span> competitors
              </span>
              <div className="flex items-center gap-1.5 pl-3 border-l border-border">
                <span className="text-[11px] text-muted">Per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="py-1 px-2 border border-border rounded-lg bg-white text-xs font-semibold text-primary focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={safeCurrentPage <= 1}
                className="p-1.5 rounded-lg border border-border bg-white text-primary hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="First Page"
              >
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safeCurrentPage <= 1}
                className="p-1.5 rounded-lg border border-border bg-white text-primary hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Previous Page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              {/* Page Numbers */}
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
                      className={`min-w-7 h-7 px-2 rounded-lg text-xs font-semibold transition-all ${
                        page === safeCurrentPage
                          ? "bg-primary text-white shadow-xs"
                          : "bg-white border border-border text-slate-700 hover:bg-slate-100"
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
                className="p-1.5 rounded-lg border border-border bg-white text-primary hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Next Page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={safeCurrentPage >= totalPages}
                className="p-1.5 rounded-lg border border-border bg-white text-primary hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Last Page"
              >
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
      </div>

      {/* Modal: Add / Edit Player */}
      {modalOpen && (
        <div className="fixed inset-0 !m-0 m-0 z-50 flex items-center justify-center p-4 bg-primary/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full border border-border shadow-elevated overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-slate-50">
              <h3 className="font-heading font-bold text-primary text-sm">
                {editingPlayer ? "Edit Competitor Record" : "Register New Competitor"}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-muted hover:text-primary hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs overflow-y-auto">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Registered Partnerships Info Banner */}
              {editingPlayer && (() => {
                const parts = getPlayerPartnerships(editingPlayer);
                if (parts.length === 0) return null;
                return (
                  <div className="p-3.5 bg-teal-50/80 border border-teal-200 rounded-xl space-y-2">
                    <div className="font-bold text-teal-900 text-xs flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-teal-600" />
                      <span>Active Doubles Partnerships</span>
                    </div>
                    <div className="space-y-1.5">
                      {parts.map((ptn) => (
                        <div key={ptn.team_id || ptn.category} className="text-xs bg-white/80 p-2 rounded-lg border border-teal-100 flex items-center justify-between gap-2">
                          <span className="font-bold text-slate-600 text-[11px]">{ptn.category}:</span>
                          <span className="font-extrabold text-teal-800 text-[11px] flex items-center gap-1">
                            <span>Partner: {ptn.partner_name}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-muted">
                      💡 To create, change, or rename doubles teams, visit the Teams Management section.
                    </p>
                  </div>
                );
              })()}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-primary uppercase tracking-wider">
                    Player Identification (ID) *
                  </label>
                  {!editingPlayer && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, player_id: getNextPlayerId(players) })}
                      className="text-[11px] font-bold text-teal-600 hover:text-teal-700 hover:underline flex items-center gap-1 cursor-pointer"
                      title="Recalculate next sequential ID"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Auto-fill #{players.length + 1}</span>
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  required
                  value={formData.player_id}
                  onChange={(e) => setFormData({ ...formData, player_id: e.target.value.toUpperCase() })}
                  placeholder={`e.g. ${getNextPlayerId(players)}`}
                  className="w-full px-3 py-2 border border-border rounded-xl bg-white text-primary focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 uppercase font-mono font-bold"
                />
                {!editingPlayer && (
                  <p className="text-[11px] text-muted mt-1 flex items-center justify-between">
                    <span>Autofilled based on {players.length} registered player{players.length === 1 ? "" : "s"}.</span>
                    <span className="font-mono text-slate-500">Next: {getNextPlayerId(players)}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-primary uppercase tracking-wider mb-1">
                  Full Legal Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="e.g. Viktor Axelsen"
                  className="w-full px-3 py-2 border border-border rounded-xl bg-white text-primary focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-primary uppercase tracking-wider mb-1">
                  Biological Gender *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {["Male", "Female"].map((g) => (
                    <button
                      type="button"
                      key={g}
                      onClick={() => handleGenderChange(g)}
                      className={`py-2 rounded-xl border text-xs font-bold transition-colors ${
                        formData.gender === g
                          ? "border-primary bg-primary text-white shadow-subtle"
                          : "border-border bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-primary uppercase tracking-wider mb-1">
                  Eligible Tournament Categories *
                </label>
                <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-border">
                  {allCategories.map((cat) => {
                    const checked = formData.eligible_categories.includes(cat);
                    const disabled =
                      (formData.gender === "Male" && cat.includes("Women's")) ||
                      (formData.gender === "Female" && cat.includes("Men's"));

                    return (
                      <label
                        key={cat}
                        className={`flex items-center gap-2 p-1.5 rounded-lg cursor-pointer transition-colors ${
                          disabled
                            ? "opacity-40 cursor-not-allowed"
                            : checked
                            ? "bg-teal-50/80 text-teal-900 font-semibold"
                            : "hover:bg-white"
                        }`}
                      >
                        <input
                          type="checkbox"
                          disabled={disabled}
                          checked={checked}
                          onChange={() => toggleCategory(cat)}
                          className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                        />
                        <span>{cat}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-border flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 font-semibold text-muted hover:text-primary transition-colors text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 font-bold rounded-xl bg-primary text-white hover:bg-secondary transition-colors text-xs disabled:opacity-50 shadow-subtle"
                >
                  {submitting ? "Saving..." : "Save Competitor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal (Replaces browser confirm) */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="Remove Competitor?"
        message={`Are you sure you want to remove competitor "${deleteConfirm.name}" from the tournament? This action will remove their eligibility and records.`}
        confirmText="Remove Competitor"
        cancelText="Cancel"
        variant="danger"
        submitting={deleteSubmitting}
        onConfirm={handleExecuteDelete}
        onClose={() => setDeleteConfirm({ isOpen: false, id: null, name: "" })}
      />

      {/* Custom Toast Notification (Replaces browser alert) */}
      <ToastNotification
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "info" })}
      />
    </>
  );
}