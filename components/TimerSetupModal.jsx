import { useState } from "react";

export default function TimerSetupModal({ isOpen, onClose, onStart }) {
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);

  const handleSubmit = (e) => {
    e.preventDefault();
    const total = Number(minutes) * 60 + Number(seconds);
    if (total <= 0) {
      alert("Please enter a positive duration.");
      return;
    }
    onStart(total);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg p-6 w-80 shadow-lg">
        <h2 className="text-lg font-semibold mb-4">Set Match Timer</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
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
