import { NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { forwardToBackend } from "@/lib/backendProxy";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const proxied = await forwardToBackend(request, "/api/settings");
  if (proxied) return proxied;

  try {
    const settings = getSettings();
    return NextResponse.json({ settings });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request) {
  const proxied = await forwardToBackend(request, "/api/settings");
  if (proxied) return proxied;

  const session = getAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 401 });
  }

  try {
    const data = await request.json();
    const updated = updateSettings(data);
    return NextResponse.json({ success: true, settings: updated });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
