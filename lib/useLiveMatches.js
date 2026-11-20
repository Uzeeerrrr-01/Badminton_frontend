"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { io } from "socket.io-client";
import { supabase, isSupabaseConfigured } from "./supabaseClient";

export function useLiveMatches() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const matchesRef = useRef(matches);
  matchesRef.current = matches;

  // Apply a single match update to the list immediately
  const applyMatchUpdate = useCallback((updated) => {
    if (!updated) return;
    const updateId = String(updated.id || updated._id || "");
    if (!updateId) return;

    setMatches((prev) => {
      if (updated.deleted) {
        return prev.filter((m) => String(m.id || m._id) !== updateId);
      }
      const index = prev.findIndex((m) => String(m.id || m._id) === updateId);
      if (index >= 0) {
        const next = [...prev];
        next[index] = { ...next[index], ...updated };
        return next;
      } else {
        return [updated, ...prev];
      }
    });
  }, []);

  const fetchMatches = useCallback(async () => {
    try {
      const res = await fetch("/api/matches", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch matches");
      const data = await res.json();
      const serverMatches = data.matches || [];
      setMatches(serverMatches);
    } catch (err) {
      console.error("Match fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMatches();

    // 1. Socket.IO Real-time Connection for true bidirectional live streaming
    let socket = null;
    try {
      // Resolve Socket.IO backend URL (safely handling localhost vs production domain)
      let socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
      if (typeof window !== "undefined") {
        const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
        if (!socketUrl || (!isLocal && socketUrl.includes("localhost"))) {
          socketUrl = isLocal
            ? "http://localhost:5050"
            : `https://api.${window.location.hostname.replace(/^api\./, "")}`;
        }
      }

      socket = io(socketUrl, {
        transports: ["websocket", "polling"],
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
      });

      const handleSocketUpdate = (data) => {
        if (!data) return;
        const matchData = data.match || data;
        applyMatchUpdate(matchData);
      };

      socket.on("match_update", handleSocketUpdate);
      socket.on("score_update", handleSocketUpdate);
    } catch (e) {
      console.warn("Socket.io client initialization failed:", e);
    }

    // 2. Server-Sent Events (SSE) from API
    let eventSource = null;
    try {
      eventSource = new EventSource("/api/realtime");

      const handleIncoming = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data && (data.id || data._id)) {
            applyMatchUpdate(data);
          } else if (data && data.match) {
            applyMatchUpdate(data.match);
          }
        } catch (_) {}
      };

      eventSource.addEventListener("match_update", handleIncoming);
      eventSource.addEventListener("score_update", handleIncoming);
      eventSource.onmessage = handleIncoming;
    } catch (e) {
      console.error("EventSource initialization failed:", e);
    }

    // 3. Zero-latency BroadcastChannel for instant same-browser cross-tab sync
    let bc = null;
    try {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        bc = new BroadcastChannel("badminton_live_scoring");
        bc.onmessage = (e) => {
          if (e.data?.match) {
            applyMatchUpdate(e.data.match);
          } else if (e.data?.id) {
            applyMatchUpdate(e.data);
          }
        };
      }
    } catch (_) {}

    // 4. Storage event listener for cross-tab sync
    const handleStorage = (e) => {
      if (e.key === "badminton_live_score_sync" && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed?.match) applyMatchUpdate(parsed.match);
        } catch (_) {}
      }
    };
    if (typeof window !== "undefined") {
      window.addEventListener("storage", handleStorage);
    }

    // 5. Custom DOM event in same window
    const handleCustomEvent = (e) => {
      if (e.detail) applyMatchUpdate(e.detail);
    };
    if (typeof window !== "undefined") {
      window.addEventListener("live_match_score_updated", handleCustomEvent);
    }

    // 6. Supabase Realtime (if configured)
    let channel = null;
    if (isSupabaseConfigured && supabase) {
      channel = supabase
        .channel("public-matches-realtime")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "matches" },
          () => {
            fetchMatches();
          }
        )
        .subscribe();
    }

    // 7. Background Polling fallback (every 1.5 seconds for instant live updates)
    const pollInterval = setInterval(() => {
      fetchMatches();
    }, 1500);

    // 8. Instant sync when browser tab gains focus or visibility
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchMatches();
      }
    };
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibility);
    }
    if (typeof window !== "undefined") {
      window.addEventListener("focus", fetchMatches);
    }

    return () => {
      clearInterval(pollInterval);
      if (socket) {
        try {
          socket.disconnect();
        } catch (_) {}
      }
      if (bc) {
        try {
          bc.close();
        } catch (_) {}
      }
      if (eventSource) eventSource.close();
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", handleStorage);
        window.removeEventListener("live_match_score_updated", handleCustomEvent);
        window.removeEventListener("focus", fetchMatches);
      }
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibility);
      }
      if (channel && supabase) supabase.removeChannel(channel);
    };
  }, [fetchMatches, applyMatchUpdate]);

  return { matches, loading, error, refresh: fetchMatches };
}
