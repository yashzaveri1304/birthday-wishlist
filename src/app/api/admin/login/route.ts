import { checkPassword, json, startAdminSession } from "@/lib/security";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!checkPassword(body?.password)) {
    await new Promise((r) => setTimeout(r, 800)); // slows down password guessing
    return json({ error: "Wrong password." }, 401);
  }
  await startAdminSession();
  return json({ ok: true });
}
