import { serverDb } from "@/lib/supabase";
import { isAdmin, isUuid, json, unauthorized } from "@/lib/security";

// Save a new order: body = { ids: [first, second, ...] }
export async function POST(req: Request) {
  if (!(await isAdmin())) return unauthorized();
  const body = await req.json().catch(() => null);
  const ids: unknown = body?.ids;
  if (!Array.isArray(ids) || ids.length > 500 || !ids.every(isUuid))
    return json({ error: "Bad order." }, 400);

  const db = serverDb();
  const results = await Promise.all(
    ids.map((id, position) =>
      db.from("items").update({ position }).eq("id", id),
    ),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) return json({ error: failed.error.message }, 500);
  return json({ ok: true });
}
