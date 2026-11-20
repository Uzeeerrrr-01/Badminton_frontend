import { NextResponse } from "next/server";

export function getBackendUrl() {
  const url =
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_SOCKET_URL ||
    "http://localhost:5050";
  return url.replace(/\/$/, "");
}

/**
 * Forwards an incoming Next.js API request to the Express backend.
 * Returns a NextResponse on success, or null if the backend is unreachable.
 */
export async function forwardToBackend(request, path) {
  try {
    const backendBase = getBackendUrl();
    const incomingUrl = new URL(request.url);
    const targetUrl = `${backendBase}${path}${incomingUrl.search}`;

    const headers = new Headers();
    request.headers.forEach((val, key) => {
      const lower = key.toLowerCase();
      if (!["host", "content-length", "connection"].includes(lower)) {
        headers.set(key, val);
      }
    });

    const init = {
      method: request.method,
      headers,
      cache: "no-store",
    };

    if (!["GET", "HEAD"].includes(request.method)) {
      try {
        init.body = await request.text();
      } catch (_) {}
    }

    const res = await fetch(targetUrl, init);
    const data = await res.text();

    const resHeaders = new Headers();
    res.headers.forEach((val, key) => {
      const lower = key.toLowerCase();
      if (!["content-encoding", "transfer-encoding"].includes(lower)) {
        resHeaders.set(key, val);
      }
    });
    resHeaders.set("Cache-Control", "no-store, no-cache, must-revalidate");

    return new NextResponse(data, {
      status: res.status,
      headers: resHeaders,
    });
  } catch (err) {
    console.warn(`[BackendProxy] Failed to forward ${request.method} ${path}:`, err.message);
    return null;
  }
}
