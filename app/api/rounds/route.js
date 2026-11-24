import { NextResponse } from "next/server";
import { forwardToBackend } from "@/lib/backendProxy";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const proxied = await forwardToBackend(request, "/api/rounds");
  if (proxied) return proxied;
  return NextResponse.json({ rounds: [] });
}
