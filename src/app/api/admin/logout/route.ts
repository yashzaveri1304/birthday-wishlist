import { endAdminSession, json } from "@/lib/security";

export async function POST() {
  await endAdminSession();
  return json({ ok: true });
}
