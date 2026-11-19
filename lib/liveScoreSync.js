/**
 * Cross-tab and in-memory real-time sync for live match scores.
 * Ensures that scoring a point in the admin scoring terminal
 * instantaneously updates the public home page and scoreboards.
 */

export function broadcastScoreUpdate(match) {
  if (!match) return;

  // 1. BroadcastChannel: 0ms latency across tabs and windows on the same origin
  try {
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      const bc = new BroadcastChannel("badminton_live_scoring");
      bc.postMessage({ type: "match_update", match });
      // Small timeout before closing so message delivers
      setTimeout(() => {
        try {
          bc.close();
        } catch (_) {}
      }, 100);
    }
  } catch (_) {}

  // 2. Storage event: triggers `storage` event in all other open browser tabs
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(
        "badminton_live_score_sync",
        JSON.stringify({ match, ts: Date.now() })
      );
    }
  } catch (_) {}

  // 3. Custom DOM Event: triggers in current window/tab
  try {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("live_match_score_updated", { detail: match }));
    }
  } catch (_) {}
}
