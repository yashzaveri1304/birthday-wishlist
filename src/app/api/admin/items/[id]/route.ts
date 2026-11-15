import { serverDb, IMAGE_BUCKET } from "@/lib/supabase";
import { isAdmin, isUuid, json, unauthorized } from "@/lib/security";
import { ADMIN_COLUMNS } from "@/lib/types";
import { validateItem } from "../validate";

type Ctx = { params: Promise<{ id: string }> };

// Edit a gift. Claim fields are never touched here.
export async function PATCH(req: Request, { params }: Ctx) {
  if (!(await isAdmin())) return unauthorized();
  const { id } = await params;
  if (!isUuid(id)) return json({ error: "Unknown gift." }, 400);
  const result = validateItem(await req.json().catch(() => null));
  if ("error" in result) return json(result, 400);

  const { data, error } = await serverDb()
    .from("items")
    .update(result.fields)
    .eq("id", id)
    .select(ADMIN_COLUMNS)
    .single();
  if (error) return json({ error: error.message }, 500);
  return json({ item: data });
}

// Delete a gift (and its uploaded picture, if it was uploaded here).
export async function DELETE(_req: Request, { params }: Ctx) {
  if (!(await isAdmin())) return unauthorized();
  const { id } = await params;
  if (!isUuid(id)) return json({ error: "Unknown gift." }, 400);

  const db = serverDb();
  const { data: item } = await db
    .from("items")
    .select("image_url")
    .eq("id", id)
    .single();
  const { error } = await db.from("items").delete().eq("id", id);
  if (error) return json({ error: error.message }, 500);

  const marker = `/storage/v1/object/public/${IMAGE_BUCKET}/`;
  const url: string | null = item?.image_url ?? null;
  if (url?.includes(marker)) {
    await db.storage
      .from(IMAGE_BUCKET)
      .remove([url.split(marker)[1]])
      .catch(() => {});
  }
  return json({ ok: true });
}
