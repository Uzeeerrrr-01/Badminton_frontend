import { NextResponse } from "next/server";

export function getBackendUrl() {
  const url = process.env.BACKEND_URL || (process.env.NODE_ENV === "development" ? "http://localhost:5050" : null);
  if (!url) return null;
  return url.replace(/\/$/, "");
}

/**
 * Forwards an incoming Next.js API request to the Express backend if BACKEND_URL is explicitly configured.
 * Accurately propagates authentication cookies, query parameters, and headers without mutating the stream on failure.
 */
export async function forwardToBackend(request, path) {
  const backendBase = getBackendUrl();
  if (!backendBase) {
    return null; // Directly use Next.js internal SQLite engine
  }

  try {
    const incomingUrl = new URL(request.url);
    const targetUrl = `${backendBase}${path}${incomingUrl.search}`;

    const headers = new Headers();
    request.headers.forEach((val, key) => {
      const lower = key.toLowerCase();
      if (!["host", "content-length", "connection"].includes(lower)) {
        headers.set(key, val);
      }
    });

    const incomingCookie = request.headers.get("cookie");
    if (incomingCookie) {
      headers.set("cookie", incomingCookie);
    }

    const init = {
      method: request.method,
      headers,
      cache: "no-store",
    };

    if (!["GET", "HEAD"].includes(request.method)) {
      try {
        const cloned = request.clone();
        init.body = await cloned.text();
      } catch (_) {}
    }

    const res = await fetch(targetUrl, init);
    const data = await res.text();

    const resHeaders = new Headers();
    res.headers.forEach((val, key) => {
      const lower = key.toLowerCase();
      if (!["content-encoding", "transfer-encoding", "set-cookie"].includes(lower)) {
        resHeaders.set(key, val);
      }
    });
    resHeaders.set("Cache-Control", "no-store, no-cache, must-revalidate");

    const response = new NextResponse(data, {
      status: res.status,
      headers: resHeaders,
    });

    const setCookies =
      typeof res.headers.getSetCookie === "function"
        ? res.headers.getSetCookie()
        : [res.headers.get("set-cookie")].filter(Boolean);

    for (const cookieStr of setCookies) {
      response.headers.append("Set-Cookie", cookieStr);
    }

    return response;
  } catch (err) {
    console.warn(`[BackendProxy] Failed to forward ${request.method} ${path}:`, err.message);
    return null;
  }
}
