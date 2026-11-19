"use client";

import { X, AlertCircle, RefreshCw } from "lucide-react";

export default function FaultsGuideModal({ isOpen = true, onClose }) {
  if (!isOpen) return null;

  const faults = [
    {
      title: "Out of Bounds",
      description: "Shuttlecock lands completely outside the boundary lines for the current match format (inner sidelines for singles, outer sidelines for doubles).",
      icon: "🏸",
    },
    {
      title: "Body / Clothing Contact",
      description: "Shuttle touches a player's body, clothing, or hair before touching the ground, regardless of whether they were standing inside or outside court lines.",
      icon: "👤",
    },
    {
      title: "Double Hit",
      description: "A player hits the shuttlecock twice in succession, or both doubles partners strike the shuttle successively during the same rally.",
      icon: "⚡",
    },
    {
      title: "Net Contact",
      description: "Player touches the net, net posts, or cord with their racket, body, or apparel while the shuttle is in play.",
      icon: "🕸️",
    },
    {
      title: "Carrying / Slingshot",
      description: "Shuttlecock is caught and held on the racket head, or slung rather than crisply rebounded during a stroke.",
      icon: "🛑",
    },
    {
      title: "Obstruction & Distraction",
      description: "Player deliberately obstructs the opponent's legitimate stroke, invades opponent's court under the net, or shouts to distract.",
      icon: "⚠️",
    },
    {
      title: "Net Failure",
      description: "Shuttle fails to pass over the net, passes through or under the net, or gets suspended in the net mesh.",
      icon: "❌",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-surface rounded-2xl max-w-lg w-full border border-border shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <h3 className="text-base font-bold text-primary">Official Badminton Faults & Rules</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted hover:text-primary hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Fault list */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-3.5 text-sm">
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2.5">
            <RefreshCw className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">What is a LET?</span> A let means the rally is null and void and must be replayed with no point awarded. Use the dedicated <span className="font-semibold text-emerald-800">LET / Replay</span> button on the scoring panel.
            </div>
          </div>

          <div className="divide-y divide-border">
            {faults.map((f, i) => (
              <div key={i} className="pt-3 pb-3 first:pt-1">
                <div className="flex items-center gap-2 font-semibold text-primary">
                  <span>{f.icon}</span>
                  <span>{f.title}</span>
                </div>
                <p className="text-xs text-muted mt-1 leading-relaxed pl-6">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-border bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-white hover:bg-primary-light transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
}
