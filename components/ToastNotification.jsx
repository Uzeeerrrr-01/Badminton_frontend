"use client";

import { useEffect } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export default function ToastNotification({
  message,
  type = "info", // "success" | "error" | "info"
  duration = 4000,
  onClose,
}) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const isSuccess = type === "success";
  const isError = type === "error";

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full animate-slideUp">
      <div
        className={`p-4 rounded-2xl border shadow-elevated flex items-start justify-between gap-3 backdrop-blur-sm ${
          isSuccess
            ? "bg-emerald-50/95 border-emerald-200 text-emerald-900"
            : isError
            ? "bg-rose-50/95 border-rose-200 text-rose-900"
            : "bg-slate-900/95 border-slate-700 text-white"
        }`}
      >
        <div className="flex items-start gap-2.5 min-w-0">
          {isSuccess ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : isError ? (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          ) : (
            <Info className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
          )}
          <div className="text-xs font-semibold leading-snug break-words">
            {message}
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className={`p-1 rounded-lg transition-colors shrink-0 ${
            isSuccess
              ? "text-emerald-700 hover:bg-emerald-100"
              : isError
              ? "text-rose-700 hover:bg-rose-100"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          }`}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
