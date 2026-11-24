"use client";

import { useState, useEffect } from "react";
import ConfirmModal from "@/components/ConfirmModal";
import ToastNotification from "@/components/ToastNotification";
import {
  UserCheck,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertCircle,
  X,
  Users,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import SearchablePlayerSelect from "@/components/SearchablePlayerSelect";

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 9; // 3 columns x 3 rows

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "Men's Doubles",
    player1_id: "",
    player2_id: "",
  });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null, name: "" });
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "info" });

  const fetchData = async () => {
    try {
      const [tRes, pRes] = await Promise.all([
        fetch("/api/teams").then((r) => r.json()),
        fetch("/api/players").then((r) => r.json()),
      ]);
      setTeams(tRes.teams || []);
      setPlayers(pDataFilter(pRes.players || []));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const pDataFilter = (list) => list.filter((p) => p.registration_status === "Active");

  useEffect(() => {
    fetchData();
  }, []);

  const formatDefaultTeamName = (p1Id, p2Id) => {
    const p1 = players.find((p) => p.id === p1Id);
    const p2 = players.find((p) => p.id === p2Id);
    if (p1 && p2) {
      return `Team ${p1.full_name} and ${p2.full_name}`;
    }
    return "";
  };

  const openCreateModal = () => {
    setEditingTeam(null);
    const men = players.filter((p) => p.gender === "Male");
    const p1Id = men[0]?.id || "";
    const p2Id = men[1]?.id || "";
    setFormData({
      name: formatDefaultTeamName(p1Id, p2Id),
      category: "Men's Doubles",
      player1_id: p1Id,
      player2_id: p2Id,
    });
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (team) => {
    setEditingTeam(team);
    setFormData({
      name: team.name,
      category: team.category,
      player1_id: team.player1_id,
      player2_id: team.player2_id || "",
    });
    setFormError("");
    setModalOpen(true);
  };

  const getEligiblePlayersForTeam = (category, slot) => {
    return players.filter((p) => {
      if (category === "Men's Doubles") return p.gender === "Male";
      if (category === "Women's Doubles") return p.gender === "Female";
      if (category === "Mixed Doubles") {
        if (slot === 1) return p.gender === "Male";
        if (slot === 2) return p.gender === "Female";
      }
      return true;
    });
  };

  const handleCategoryChange = (cat) => {
    const p1List = getEligiblePlayersForTeam(cat, 1);
    const p2List = getEligiblePlayersForTeam(cat, 2);
    const p1Id = p1List[0]?.id || "";
    const p2Id = p2List.find((p) => p.id !== p1Id)?.id || p2List[0]?.id || "";

    setFormData({
      ...formData,
      category: cat,
      player1_id: p1Id,
      player2_id: p2Id,
      name: formatDefaultTeamName(p1Id, p2Id),
    });
  };

  const handlePlayer1Select = (p1Id) => {
    setFormData((prev) => ({
      ...prev,
      player1_id: p1Id,
      name: formatDefaultTeamName(p1Id, prev.player2_id) || prev.name,
    }));
  };

  const handlePlayer2Select = (p2Id) => {
    setFormData((prev) => ({
      ...prev,
      player2_id: p2Id,
      name: formatDefaultTeamName(prev.player1_id, p2Id) || prev.name,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (formData.player1_id === formData.player2_id) {
      setFormError("A player cannot be partnered with themselves.");
      return;
    }

    let finalName = formData.name?.trim();
    if (!finalName) {
      finalName = formatDefaultTeamName(formData.player1_id, formData.player2_id);
    }
    if (!finalName) {
      setFormError("Team name could not be generated. Please select both players.");
      return;
    }

    setSubmitting(true);
    try {
      const url = editingTeam ? `/api/teams/${editingTeam.id}` : "/api/teams";
      const method = editingTeam ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, name: finalName }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save team.");
      }

      setModalOpen(false);
      setToast({
        message: editingTeam
          ? `Team "${finalName}" updated successfully.`
          : `Team "${finalName}" created successfully.`,
        type: "success",
      });
      fetchData();
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
      const res = await fetch(`/api/teams/${deleteConfirm.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete team.");
      setToast({ message: `Team "${deleteConfirm.name}" removed successfully.`, type: "success" });
      setDeleteConfirm({ isOpen: false, id: null, name: "" });
      fetchData();
    } catch (err) {
      setToast({ message: err.message, type: "error" });
    } finally {
      setDeleteSubmitting(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [search, categoryFilter]);

  const filteredTeams = teams.filter((t) => {
    if (categoryFilter && t.category !== categoryFilter) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Pagination calculations
  const totalItems = filteredTeams.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedTeams = filteredTeams.slice(startIndex, endIndex);

  const getPageNumbers = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (safeCurrentPage <= 4) return [1, 2, 3, 4, 5, "...", totalPages];
    if (safeCurrentPage >= totalPages - 3) return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, "...", safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1, "...", totalPages];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-black text-primary tracking-tight">
            Team & Pair Management
          </h1>
          <p className="text-xs text-muted mt-1">
            Create validated Doubles & Mixed Doubles pairings adhering to tournament gender rules.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-primary hover:bg-secondary text-white text-xs font-bold transition-colors shadow-subtle flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-teal-400" />
          Create New Pair
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="p-4 rounded-2xl border border-border bg-white shadow-subtle flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search pair or team name..."
            className="w-full pl-9 pr-3 py-2 border border-border rounded-xl text-xs bg-white text-primary focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="text-xs px-3 py-2 border border-border rounded-xl bg-white text-primary focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
        >
          <option value="">All Doubles Categories</option>
          <option value="Men's Doubles">Men's Doubles</option>
          <option value="Women's Doubles">Women's Doubles</option>
          <option value="Mixed Doubles">Mixed Doubles</option>
        </select>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTeams.length === 0 ? (
          <div className="col-span-full p-12 text-center rounded-2xl border border-dashed border-border bg-white text-muted text-sm shadow-subtle">
            No doubles teams configured yet.
          </div>
        ) : (
          paginatedTeams.map((t) => (
            <div
              key={t.id}
              className="p-5 rounded-2xl border border-border bg-white shadow-subtle hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="font-heading font-bold text-primary text-base leading-snug">{t.name}</h3>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 shrink-0">
                    {t.category}
                  </span>
                </div>

                {/* Partner Badges */}
                <div className="space-y-2 mt-4">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                    <span className="font-bold text-primary">{t.player1?.full_name || "Player 1"}</span>
                    <span className="text-[10px] font-semibold text-muted px-2 py-0.5 rounded bg-white border border-slate-200">
                      {t.player1?.gender}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                    <span className="font-bold text-primary">{t.player2?.full_name || "Player 2"}</span>
                    <span className="text-[10px] font-semibold text-muted px-2 py-0.5 rounded bg-white border border-slate-200">
                      {t.player2?.gender}
                    </span>
                  </div>
                </div>

                {/* Team Performance Stats Bar */}
                <div className="mt-3 pt-3 border-t border-border/80 grid grid-cols-4 gap-1.5 text-center text-[11px]">
                  <div className="p-1.5 rounded-lg bg-slate-50 border border-border/60">
                    <span className="text-[9px] uppercase font-bold text-muted block">Played</span>
                    <span className="font-heading font-black text-primary">{t.matches_played || 0}</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-slate-50 border border-border/60">
                    <span className="text-[9px] uppercase font-bold text-muted block">Won</span>
                    <span className="font-heading font-black text-teal-700">{t.matches_won || 0}</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-slate-50 border border-border/60">
                    <span className="text-[9px] uppercase font-bold text-muted block">Lost</span>
                    <span className="font-heading font-black text-muted">{t.matches_lost || 0}</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-slate-50 border border-border/60">
                    <span className="text-[9px] uppercase font-bold text-muted block">Points</span>
                    <span className="font-heading font-black text-teal-700">{t.tournament_points || 0}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-border flex items-center justify-end gap-1">
                <button
                  type="button"
                  onClick={() => openEditModal(t)}
                  className="p-1.5 text-muted hover:text-primary hover:bg-slate-100 rounded-lg transition-colors"
                  title="Edit Team"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => requestDelete(t.id, t.name)}
                  className="p-1.5 text-muted hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Delete Team"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination Footer */}
      {filteredTeams.length > 0 && totalPages > 1 && (
        <div className="p-4 rounded-2xl border border-border bg-white shadow-subtle flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-secondary">
          <div>
            Showing <span className="font-bold text-primary">{startIndex + 1}</span> to{" "}
            <span className="font-bold text-primary">{endIndex}</span> of{" "}
            <span className="font-bold text-primary">{totalItems}</span> pairs
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCurrentPage(1)}
              disabled={safeCurrentPage <= 1}
              className="p-1.5 rounded-lg border border-border bg-white text-primary hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="First Page"
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safeCurrentPage <= 1}
              className="p-1.5 rounded-lg border border-border bg-white text-primary hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Previous Page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
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
                    className={`min-w-7 h-7 px-2 rounded-lg text-xs font-semibold transition-all ${
                      page === safeCurrentPage
                        ? "bg-primary text-white shadow-xs"
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
              className="p-1.5 rounded-lg border border-border bg-white text-primary hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Next Page"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage(totalPages)}
              disabled={safeCurrentPage >= totalPages}
              className="p-1.5 rounded-lg border border-border bg-white text-primary hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Last Page"
            >
              <ChevronsRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full border border-border shadow-elevated overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-slate-50">
              <h3 className="font-heading font-bold text-primary text-sm">
                {editingTeam ? "Edit Pair Configuration" : "Create Partnership Pair"}
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

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-primary uppercase tracking-wider">
                    Team / Partnership Name *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const auto = formatDefaultTeamName(formData.player1_id, formData.player2_id);
                      if (auto) setFormData((prev) => ({ ...prev, name: auto }));
                    }}
                    className="text-[10px] text-teal-600 hover:text-teal-800 font-bold hover:underline"
                  >
                    Auto-Fill Name
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Team Affan and Roheen"
                  className="w-full px-3 py-2 border border-border rounded-xl bg-white text-primary focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium"
                />
                <p className="text-[10px] text-muted mt-1">
                  💡 In Doubles &amp; Mixed Doubles, teams are named after players (e.g. &quot;Team Affan and Roheen&quot;).
                </p>
              </div>

              <div>
                <label className="block font-semibold text-primary uppercase tracking-wider mb-1">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-xl bg-white text-primary focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                >
                  <option value="Men's Doubles">Men's Doubles</option>
                  <option value="Women's Doubles">Women's Doubles</option>
                  <option value="Mixed Doubles">Mixed Doubles</option>
                </select>
              </div>

              <div className="space-y-3 pt-3 border-t border-border">
                <SearchablePlayerSelect
                  label={`Player 1 ${formData.category === "Mixed Doubles" ? "(Male Required)" : ""}`}
                  required
                  value={formData.player1_id}
                  onChange={handlePlayer1Select}
                  players={getEligiblePlayersForTeam(formData.category, 1)}
                  placeholder="Search and select Player 1..."
                />

                <SearchablePlayerSelect
                  label={`Player 2 ${formData.category === "Mixed Doubles" ? "(Female Required)" : ""}`}
                  required
                  value={formData.player2_id}
                  onChange={handlePlayer2Select}
                  players={getEligiblePlayersForTeam(formData.category, 2)}
                  excludeId={formData.player1_id}
                  placeholder="Search and select Player 2..."
                />
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
                  {submitting ? "Saving..." : "Save Pair"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal (Replaces browser confirm) */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="Remove Team?"
        message={`Are you sure you want to remove team "${deleteConfirm.name}"? This will dissolve the partnership.`}
        confirmText="Remove Team"
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
    </div>
  );
}