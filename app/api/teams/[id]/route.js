import { NextResponse } from "next/server";
import { getTeam, deleteTeam } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { forwardToBackend } from "@/lib/backendProxy";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  const proxied = await forwardToBackend(request, `/api/teams/${params.id}`);
  if (proxied) return proxied;

  try {
    const team = getTeam(params.id);
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }
    return NextResponse.json({ team });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const proxied = await forwardToBackend(request, `/api/teams/${params.id}`);
  if (proxied) return proxied;

  const session = getAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 401 });
  }

  try {
    deleteTeam(params.id);
    return NextResponse.json({ success: true, message: "Team deleted" });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
