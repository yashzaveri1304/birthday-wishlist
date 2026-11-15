import { serverDb } from "@/lib/supabase";
import { isUuid, json, newClaimToken, sha256 } from "@/lib/security";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const itemId = body?.itemId;
  const name = typeof body?.name === "string" ? body.name.trim() : "";

  if (!isUuid(itemId)) return json({ error: "Unknown gift." }, 400);
  if (name.length < 1 || name.length > 60)
    return json(
      { error: "Please enter your name (up to 60 characters)." },
      400,
    );

  // The secret token: the guest keeps the real value, the database keeps only its fingerprint (hash).
  const token = newClaimToken();
  const { data: won, error } = await serverDb().rpc("claim_item", {
    p_item_id: itemId,
    p_name: name,
    p_token_hash: sha256(token),
  });

  if (error)
    return json({ error: "Something went wrong. Please try again." }, 500);
  if (!won)
    return json({ error: "Someone just grabbed this one!", taken: true }, 409);
  return json({ ok: true, token });
}
