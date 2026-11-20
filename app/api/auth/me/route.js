import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { forwardToBackend } from "@/lib/backendProxy";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const proxied = await forwardToBackend(request, "/api/auth/me");
  if (proxied) {
    if (proxied.status === 200) {
      try {
        const json = await proxied.json();
        const user = json.admin || json.user || json;
        return NextResponse.json({
          authenticated: true,
          user,
          admin: user,
        });
      } catch (_) {
        return proxied;
      }
    }
    return proxied;
  }

  const session = getAdminSession(request);
  if (!session) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true, user: session, admin: session });
}
