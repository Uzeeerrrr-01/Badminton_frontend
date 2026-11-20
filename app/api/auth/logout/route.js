import { NextResponse } from "next/server";
import { forwardToBackend } from "@/lib/backendProxy";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const proxied = await forwardToBackend(request, "/api/auth/logout");
  if (proxied) return proxied;

  const response = NextResponse.json({ success: true, message: "Logged out" });
  response.cookies.set({
    name: "admin_token",
    value: "",
    httpOnly: true,
    expires: new Date(0),
    path: "/",
  });
  return response;
}
