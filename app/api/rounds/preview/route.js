import { NextResponse } from "next/server";
import { forwardToBackend } from "@/lib/backendProxy";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const proxied = await forwardToBackend(request, "/api/rounds/preview");
  if (proxied) return proxied;
  return NextResponse.json({ error: "Backend unavailable" }, { status: 503 });
}
