"use client";

import { useState, useEffect } from "react";
import { UserCheck, Plus, Search, Edit2, Trash2, AlertCircle, X, Users } from "lucide-react";
import SearchablePlayerSelect from "@/components/SearchablePlayerSelect";

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

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

  const openCreateModal = () => {
    setEditingTeam(null);
    const men = players.filter((p) => p.gender === "Male");
    setFormData({
      name: "",
      category: "Men's Doubles",
      player1_id: men[0]?.id || "",
      player2_id: men[1]?.id || "",
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

    setFormData({
      ...formData,
      category: cat,
      player1_id: p1List[0]?.id || "",
      player2_id: p2List.find((p) => p.id !== p1List[0]?.id)?.id || p2List[0]?.id || "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (formData.player1_id === formData.player2_id) {
      setFormError("A player cannot be partnered with themselves.");
      return;
    }

    setSubmitting(true);
    try {
      const url = editingTeam ? `/api/teams/${editingTeam.id}` : "/api/teams";
      const method = editingTeam ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save team.");
      }

      setModalOpen(false);
      fetchData();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to remove team "${name}"?`)) return;

    try {
      const res = await fetch(`/api/teams/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete team.");
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredTeams = teams.filter((t) => {
    if (categoryFilter && t.category !== categoryFilter) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

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
          filteredTeams.map((t) => (
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
                  onClick={() => handleDelete(t.id, t.name)}
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
                <label className="block font-semibold text-primary uppercase tracking-wider mb-1">
                  Team / Partnership Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Axelsen / Antonsen"
                  className="w-full px-3 py-2 border border-border rounded-xl bg-white text-primary focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium"
                />
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
                  onChange={(pId) => setFormData({ ...formData, player1_id: pId })}
                  players={getEligiblePlayersForTeam(formData.category, 1)}
                  placeholder="Search and select Player 1..."
                />

                <SearchablePlayerSelect
                  label={`Player 2 ${formData.category === "Mixed Doubles" ? "(Female Required)" : ""}`}
                  required
                  value={formData.player2_id}
                  onChange={(pId) => setFormData({ ...formData, player2_id: pId })}
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
    </div>
  );
}