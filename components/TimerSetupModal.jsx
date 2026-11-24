import { useState } from "react";
import { AlertCircle } from "lucide-react";

export default function TimerSetupModal({ isOpen, onClose, onStart }) {
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    const total = Number(minutes) * 60 + Number(seconds);
    if (total <= 0) {
      setError("Please enter a positive duration (at least 1 second).");
      return;
    }
    onStart(total);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-80 border border-border shadow-elevated">
        <h2 className="text-base font-heading font-black text-primary mb-3">Set Match Timer</h2>
        {error && (
          <div className="mb-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-1.5 font-medium">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <label className="text-sm">Minutes</label>
            <input
              type="number"
              min="0"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              className="border rounded w-16 p-1"
              required
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm">Seconds</label>
            <input
              type="number"
              min="0"
              max="59"
              value={seconds}
              onChange={(e) => setSeconds(e.target.value)}
              className="border rounded w-16 p-1"
              required
            />
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 bg-gray-200 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1 bg-primary text-white rounded"
            >
              Start
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
