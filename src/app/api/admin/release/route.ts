import { serverDb } from "@/lib/supabase";
import { isAdmin, isUuid, json, unauthorized } from "@/lib/security";

// Admin-only escape hatch: clear a claim (e.g. a guest lost their phone).
export async function POST(req: Request) {
  if (!(await isAdmin())) return unauthorized();
  const body = await req.json().catch(() => null);
  if (!isUuid(body?.itemId)) return json({ error: "Unknown gift." }, 400);
  const { error } = await serverDb()
    .from("items")
    .update({ claimed_by_name: null, claim_token_hash: null, claimed_at: null })
    .eq("id", body.itemId);
  if (error) return json({ error: error.message }, 500);
  return json({ ok: true });
}
