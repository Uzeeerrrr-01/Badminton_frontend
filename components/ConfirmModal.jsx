"use client";

import { useEffect } from "react";
import { AlertTriangle, Trash2, X, HelpCircle, CheckCircle2 } from "lucide-react";

export default function ConfirmModal({
  isOpen,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger", // "danger" | "warning" | "primary"
  submitting = false,
  onConfirm,
  onClose,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen && !submitting) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, submitting, onClose]);

  if (!isOpen) return null;

  const isDanger = variant === "danger";
  const isWarning = variant === "warning";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-md bg-white rounded-3xl border border-border shadow-elevated overflow-hidden animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="px-6 pt-6 pb-4 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-subtle ${
                isDanger
                  ? "bg-rose-50 text-rose-600 border border-rose-200"
                  : isWarning
                  ? "bg-amber-50 text-amber-600 border border-amber-200"
                  : "bg-teal-50 text-teal-600 border border-teal-200"
              }`}
            >
              {isDanger ? (
                <Trash2 className="w-5 h-5" />
              ) : isWarning ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <HelpCircle className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="font-heading font-black text-primary text-base leading-tight">
                {title}
              </h3>
              <p className="text-[11px] text-muted font-medium mt-0.5">Apex Badminton Open</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="p-1 rounded-xl text-muted hover:text-primary hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message Body */}
        <div className="px-6 py-2 text-xs text-secondary leading-relaxed">
          {message}
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-5 bg-slate-50/80 border-t border-border mt-4 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 rounded-xl border border-border bg-white text-secondary hover:text-primary hover:bg-slate-100 text-xs font-bold transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            className={`px-4 py-2 rounded-xl text-white text-xs font-bold transition-all shadow-subtle flex items-center gap-1.5 disabled:opacity-50 ${
              isDanger
                ? "bg-rose-600 hover:bg-rose-700"
                : isWarning
                ? "bg-amber-600 hover:bg-amber-700"
                : "bg-accent hover:bg-teal-700"
            }`}
          >
            {submitting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <span>{confirmText}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
