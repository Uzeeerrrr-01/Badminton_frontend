import crypto from "crypto";

const JWT_SECRET =
  process.env.ADMIN_JWT_SECRET || "badminton-tournament-secret-key-change-in-production";

/**
 * Creates a signed token string for admin session
 */
export function createAdminToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const data = Buffer.from(
    JSON.stringify({
      ...payload,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
    })
  ).toString("base64url");

  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${header}.${data}`)
    .digest("base64url");

  return `${header}.${data}.${signature}`;
}

/**
 * Verifies and decodes a token string
 */
export function verifyAdminToken(token) {
  if (!token || typeof token !== "string") return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [header, data, signature] = parts;
  const expectedSig = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${header}.${data}`)
    .digest("base64url");

  if (signature !== expectedSig) {
    return null; // Invalid signature
  }

  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf-8"));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }
    return payload;
  } catch (err) {
    return null;
  }
}

/**
 * Extract admin session from Request headers or cookies
 */
export function getAdminSession(request) {
  try {
    // Check Authorization header
    const authHeader = request.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const session = verifyAdminToken(token);
      if (session) return session;
    }

    // Check Cookie header
    const cookieHeader = request.headers.get("cookie");
    if (cookieHeader) {
      const match = cookieHeader.match(/admin_token=([^;]+)/);
      if (match && match[1]) {
        const session = verifyAdminToken(match[1]);
        if (session) return session;
      }
    }
  } catch (e) {
    console.error("Auth check error:", e);
  }
  return null;
}
