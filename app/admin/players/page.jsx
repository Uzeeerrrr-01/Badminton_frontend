"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";

export default function AdminPlayersPage() {
  const [players, setPlayers] = useState([]);
  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);

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

  const allCategories = [
    "Men's Singles",
    "Women's Singles",
    "Men's Doubles",
    "Women's Doubles",
    "Mixed Doubles",
  ];

  const fetchPlayers = async () => {
    try {
      const res = await fetch("/api/players");
      const data = await res.json();
      setPlayers(data.players || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayers();
  }, []);

  const openCreateModal = () => {
    setEditingPlayer(null);
    setFormData({
      player_id: "",
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
      fetchPlayers();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to remove competitor ${name} from the tournament?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/players/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete player.");
      }
      fetchPlayers();
    } catch (err) {
      alert(err.message);
    }
  };

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

  return (
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
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredPlayers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted">
                    No registered players match the search criteria.
                  </td>
                </tr>
              ) : (
                filteredPlayers.map((p) => (
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
                      <div className="flex flex-wrap gap-1">
                        {(p.eligible_categories || []).map((cat) => (
                          <span
                            key={cat}
                            className="bg-slate-100 text-slate-700 text-[10px] font-medium px-2 py-0.5 rounded-md border border-slate-200/80"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
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
                          onClick={() => handleDelete(p.id, p.full_name)}
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
      </div>

      {/* Modal: Add / Edit Player */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/70 backdrop-blur-xs animate-in fade-in">
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

              <div>
                <label className="block font-semibold text-primary uppercase tracking-wider mb-1">
                  Player Identification (ID) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.player_id}
                  onChange={(e) => setFormData({ ...formData, player_id: e.target.value })}
                  placeholder="e.g. PLY-001"
                  className="w-full px-3 py-2 border border-border rounded-xl bg-white text-primary focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 uppercase font-mono"
                />
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
    </div>
  );
}