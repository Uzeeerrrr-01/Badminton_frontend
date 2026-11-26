"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { io } from "socket.io-client";
import { supabase, isSupabaseConfigured } from "./supabaseClient";

const SPECIFIC_CATEGORIES = [
  "Men's Singles",
  "Women's Singles",
  "Men's Doubles",
  "Women's Doubles",
  "Mixed Doubles",
];

function computeLeadersFallback(lb) {
  const leaders = {};
  SPECIFIC_CATEGORIES.forEach((cat) => {
    const catRecords = lb
      .filter((r) => r.category === cat)
      .sort(
        (a, b) =>
          (b.total_tournament_points || 0) - (a.total_tournament_points || 0) ||
          (b.matches_won || 0) - (a.matches_won || 0)
      );
    leaders[cat] = {
      leader: catRecords[0] || null,
      totalParticipants: catRecords.length,
    };
  });
  return leaders;
}

export function useLiveLeaderboard({ includeSettings = false } = {}) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [history, setHistory] = useState([]);
  const [settings, setSettings] = useState(null);
  const [categoryLeaders, setCategoryLeaders] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const debounceRef = useRef(null);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const requests = [
        fetch("/api/points", { cache: "no-store" }).then((r) => (r.ok ? r.json() : {})),
      ];
      if (includeSettings) {
        requests.push(
          fetch("/api/settings", { cache: "no-store" }).then((r) => (r.ok ? r.json() : {}))
        );
      }

      const [ptRes, sRes] = await Promise.allSettled(requests);
      const ptData = ptRes.status === "fulfilled" ? ptRes.value || {} : {};
      const lb = ptData.leaderboard || (Array.isArray(ptData) ? ptData : []);

      setLeaderboard(lb);
      setHistory(ptData.history || []);
      setLastUpdated(new Date());

      if (ptData.categoryLeaders && Object.keys(ptData.categoryLeaders).length > 0) {
        setCategoryLeaders(ptData.categoryLeaders);
      } else {
        setCategoryLeaders(computeLeadersFallback(lb));
      }

      if (includeSettings && sRes) {
        const sData = sRes.status === "fulfilled" ? sRes.value || {} : {};
        setSettings(sData.settings || null);
      }
    } catch (err) {
      console.error("Live leaderboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [includeSettings]);

  const scheduleRefresh = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchLeaderboard();
    }, 120);
  }, [fetchLeaderboard]);

  useEffect(() => {
    fetchLeaderboard();

    // 1. Socket.IO Real-time Connection
    let socket = null;
    try {
      let socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
      if (typeof window !== "undefined") {
        const isLocal =
          window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
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

      socket.on("points_update", scheduleRefresh);
      socket.on("match_update", scheduleRefresh);
      socket.on("score_update", scheduleRefresh);
    } catch (e) {
      console.warn("Socket.io leaderboard client init failed:", e);
    }

    // 2. Server-Sent Events (SSE)
    let eventSource = null;
    try {
      eventSource = new EventSource("/api/realtime");
      eventSource.addEventListener("points_update", scheduleRefresh);
      eventSource.addEventListener("match_update", scheduleRefresh);
      eventSource.addEventListener("score_update", scheduleRefresh);
    } catch (e) {
      console.warn("EventSource leaderboard init failed:", e);
    }

    // 3. Cross-tab BroadcastChannel + Storage + Custom DOM event
    let bc = null;
    try {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        bc = new BroadcastChannel("badminton_live_scoring");
        bc.onmessage = scheduleRefresh;
      }
    } catch (_) {}

    const handleStorage = (e) => {
      if (e.key === "badminton_live_score_sync") scheduleRefresh();
    };
    const handleCustomEvent = () => scheduleRefresh();

    if (typeof window !== "undefined") {
      window.addEventListener("storage", handleStorage);
      window.addEventListener("live_match_score_updated", handleCustomEvent);
      window.addEventListener("focus", fetchLeaderboard);
    }

    const handleVisibility = () => {
      if (document.visibilityState === "visible") fetchLeaderboard();
    };
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibility);
    }

    // 4. Supabase Realtime (if configured)
    let channel = null;
    if (isSupabaseConfigured && supabase) {
      channel = supabase
        .channel("public-leaderboard-realtime")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "matches" },
          scheduleRefresh
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "tournament_points" },
          scheduleRefresh
        )
        .subscribe();
    }

    // 5. Polling fallback (every 3 seconds)
    const pollInterval = setInterval(fetchLeaderboard, 3000);

    return () => {
      clearInterval(pollInterval);
      if (debounceRef.current) clearTimeout(debounceRef.current);
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
        window.removeEventListener("focus", fetchLeaderboard);
      }
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibility);
      }
      if (channel && supabase) supabase.removeChannel(channel);
    };
  }, [fetchLeaderboard, scheduleRefresh]);

  return {
    leaderboard,
    history,
    settings,
    categoryLeaders,
    loading,
    lastUpdated,
    refresh: fetchLeaderboard,
  };
}
