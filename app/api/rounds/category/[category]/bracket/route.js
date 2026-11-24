import { NextResponse } from "next/server";
import { forwardToBackend } from "@/lib/backendProxy";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  const category = decodeURIComponent(params.category);
  const proxied = await forwardToBackend(request, `/api/rounds/category/${encodeURIComponent(category)}/bracket`);
  if (proxied) return proxied;
  return NextResponse.json({ error: "Backend unavailable" }, { status: 503 });
}
