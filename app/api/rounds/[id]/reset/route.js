import { NextResponse } from "next/server";
import { forwardToBackend } from "@/lib/backendProxy";

export const dynamic = "force-dynamic";

export async function POST(request, { params }) {
  const { id } = params;
  const proxied = await forwardToBackend(request, `/api/rounds/${id}/reset`);
  if (proxied) return proxied;
  return NextResponse.json({ error: "Backend unavailable" }, { status: 503 });
}
