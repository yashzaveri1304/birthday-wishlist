import "server-only";
import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { cookies } from "next/headers";
import { requireEnv } from "./env";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (v: unknown): v is string =>
  typeof v === "string" && UUID_RE.test(v);

export const sha256 = (v: string) =>
  createHash("sha256").update(v).digest("hex");
export const newClaimToken = () => randomBytes(32).toString("base64url");

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(sha256(a));
  const bb = Buffer.from(sha256(b));
  return timingSafeEqual(ab, bb);
}

// ---------- Admin session (a signed, httpOnly cookie) ----------
const COOKIE = "wl_admin";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

function sign(payload: string) {
  return createHmac("sha256", requireEnv("ADMIN_PASSWORD"))
    .update(payload)
    .digest("base64url");
}

export function checkPassword(attempt: unknown) {
  return (
    typeof attempt === "string" &&
    attempt.length > 0 &&
    safeEqual(attempt, requireEnv("ADMIN_PASSWORD"))
  );
}

export async function startAdminSession() {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS;
  const value = `${exp}.${sign(`admin:${exp}`)}`;
  (await cookies()).set(COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function endAdminSession() {
  (await cookies()).delete(COOKIE);
}

export async function isAdmin(): Promise<boolean> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return false;
  const [exp, sig] = raw.split(".");
  if (!exp || !sig || Number(exp) < Date.now() / 1000) return false;
  return safeEqual(sig, sign(`admin:${exp}`));
}

export const json = (body: unknown, status = 200) =>
  Response.json(body, { status });
export const unauthorized = () => json({ error: "Please log in again." }, 401);
