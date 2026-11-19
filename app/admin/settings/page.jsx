"use client";

import { useState, useEffect } from "react";
import { Settings, Save, CheckCircle, AlertCircle, Sparkles } from "lucide-react";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    venue: "",
    number_of_courts: 4,
    points_per_win: 3,
    points_per_participation: 1,
    bonus_sweep_points: 1,
    ranking_type: "both",
    scoring_target_points: 11,
    scoring_deuce_lead: 2,
    scoring_max_points: 15,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.settings) {
          setSettings(data.settings);
          setFormData({
            name: data.settings.name || "",
            description: data.settings.description || "",
            venue: data.settings.venue || "",
            number_of_courts: data.settings.number_of_courts || 4,
            points_per_win: data.settings.points_per_win || 3,
            points_per_participation: data.settings.points_per_participation || 1,
            bonus_sweep_points: data.settings.bonus_sweep_points || 1,
            ranking_type: data.settings.ranking_type || "both",
            scoring_target_points: data.settings.scoring_target_points || 11,
            scoring_deuce_lead: data.settings.scoring_deuce_lead || 2,
            scoring_max_points: data.settings.scoring_max_points || 15,
          });
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update settings.");

      setSuccessMsg("Tournament settings updated successfully.");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-muted">
        <div className="inline-flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-teal-500 animate-ping"></span>
          <span>Loading tournament configuration...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="pb-6 border-b border-border">
        <h1 className="text-2xl sm:text-3xl font-heading font-black text-primary tracking-tight">
          Tournament Settings
        </h1>
        <p className="text-xs text-muted mt-1">
          Configure tournament identity, venue location, court allocation, and official scoring rules.
        </p>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200 text-teal-800 text-xs flex items-center gap-2 shadow-subtle">
          <CheckCircle className="w-4 h-4 text-teal-600 shrink-0" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 shadow-subtle">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        {/* Tournament General Info */}
        <div className="bg-white rounded-2xl border border-border p-6 shadow-subtle space-y-4">
          <h2 className="text-xs font-heading font-bold text-primary uppercase tracking-wider">
            General Tournament Identity
          </h2>

          <div>
            <label className="block font-semibold text-primary uppercase tracking-wider mb-1">
              Tournament Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-xl bg-white text-primary text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium"
            />
          </div>

          <div>
            <label className="block font-semibold text-primary uppercase tracking-wider mb-1">
              Tournament Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-xl bg-white text-primary focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-primary uppercase tracking-wider mb-1">
                Venue Location
              </label>
              <input
                type="text"
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-xl bg-white text-primary focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-primary uppercase tracking-wider mb-1">
                Number of Courts Configured *
              </label>
              <input
                type="number"
                min="1"
                max="16"
                required
                value={formData.number_of_courts}
                onChange={(e) => setFormData({ ...formData, number_of_courts: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-border rounded-xl bg-white text-primary focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Scoring System Rules */}
        <div className="bg-white rounded-2xl border border-border p-6 shadow-subtle space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-600" />
            <h2 className="text-xs font-heading font-bold text-primary uppercase tracking-wider">
              Scoring Engine Rules (Default: Official 11-Pt Rulebook)
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-primary uppercase tracking-wider mb-1">
                Target Score *
              </label>
              <input
                type="number"
                min="7"
                max="30"
                required
                value={formData.scoring_target_points}
                onChange={(e) => setFormData({ ...formData, scoring_target_points: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-border rounded-xl bg-white text-primary focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-mono"
              />
              <span className="text-[10px] text-muted block mt-1">Default 11 points</span>
            </div>

            <div>
              <label className="block font-semibold text-primary uppercase tracking-wider mb-1">
                Deuce Lead Required *
              </label>
              <input
                type="number"
                min="1"
                max="5"
                required
                value={formData.scoring_deuce_lead}
                onChange={(e) => setFormData({ ...formData, scoring_deuce_lead: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-border rounded-xl bg-white text-primary focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-mono"
              />
              <span className="text-[10px] text-muted block mt-1">Default 2-point gap</span>
            </div>

            <div>
              <label className="block font-semibold text-primary uppercase tracking-wider mb-1">
                Max Score (Sudden Death) *
              </label>
              <input
                type="number"
                min="11"
                max="35"
                required
                value={formData.scoring_max_points}
                onChange={(e) => setFormData({ ...formData, scoring_max_points: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-border rounded-xl bg-white text-primary focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-mono"
              />
              <span className="text-[10px] text-muted block mt-1">Default 15-point cap</span>
            </div>
          </div>
        </div>

        {/* Tournament Points & Standings Formula */}
        <div className="bg-white rounded-2xl border border-border p-6 shadow-subtle space-y-4">
          <h2 className="text-xs font-heading font-bold text-primary uppercase tracking-wider">
            Tournament Standings Formula
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-primary uppercase tracking-wider mb-1">
                Points per Match Victory *
              </label>
              <input
                type="number"
                min="0"
                max="10"
                required
                value={formData.points_per_win}
                onChange={(e) => setFormData({ ...formData, points_per_win: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-border rounded-xl bg-white text-primary focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-primary uppercase tracking-wider mb-1">
                Participation Credit *
              </label>
              <input
                type="number"
                min="0"
                max="5"
                required
                value={formData.points_per_participation}
                onChange={(e) => setFormData({ ...formData, points_per_participation: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-border rounded-xl bg-white text-primary focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-primary uppercase tracking-wider mb-1">
                Sweep Dominance Bonus *
              </label>
              <input
                type="number"
                min="0"
                max="5"
                required
                value={formData.bonus_sweep_points}
                onChange={(e) => setFormData({ ...formData, bonus_sweep_points: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-border rounded-xl bg-white text-primary focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-mono"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-primary hover:bg-secondary text-white font-bold text-xs transition-colors flex items-center gap-2 shadow-subtle disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-teal-400" />
            {saving ? "Saving Configuration..." : "Save Tournament Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}