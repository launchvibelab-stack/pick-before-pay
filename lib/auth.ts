import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "review_admin";
const DEV_FALLBACK = "dev-secret-change-me-please-32-chars";

function authSecretKey() {
  const raw = process.env.AUTH_SECRET?.trim();
  if (process.env.NODE_ENV === "production") {
    if (!raw || raw.length < 32) {
      throw new Error(
        "AUTH_SECRET must be set in production to a random string of at least 32 characters."
      );
    }
    return new TextEncoder().encode(raw);
  }
  return new TextEncoder().encode(raw && raw.length >= 16 ? raw : DEV_FALLBACK);
}

export async function createSession() {
  const token = await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(authSecretKey());
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function isAdmin() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, authSecretKey());
    return payload.role === "admin";
  } catch {
    return false;
  }
}
