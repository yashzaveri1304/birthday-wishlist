import { serverDb } from "@/lib/supabase";
import { isUuid, json, sha256 } from "@/lib/security";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const itemId = body?.itemId;
  const token = body?.token;

  if (
    !isUuid(itemId) ||
    typeof token !== "string" ||
    token.length < 20 ||
    token.length > 200
  ) {
    return json({ error: "That claim can't be undone from this device." }, 400);
  }

  const { data: ok, error } = await serverDb().rpc("unclaim_item", {
    p_item_id: itemId,
    p_token_hash: sha256(token),
  });

  if (error)
    return json({ error: "Something went wrong. Please try again." }, 500);
  if (!ok)
    return json(
      { error: "Only the person who claimed this can unclaim it." },
      403,
    );
  return json({ ok: true });
}
