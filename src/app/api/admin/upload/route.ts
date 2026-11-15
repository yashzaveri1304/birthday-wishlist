import { randomUUID } from "node:crypto";
import { serverDb, IMAGE_BUCKET } from "@/lib/supabase";
import { isAdmin, json, unauthorized } from "@/lib/security";

const MAX_BYTES = 4 * 1024 * 1024; // Vercel's free tier caps uploads around 4.5 MB
const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

export async function POST(req: Request) {
  if (!(await isAdmin())) return unauthorized();
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File))
    return json({ error: "No picture received." }, 400);
  const ext = TYPES[file.type];
  if (!ext)
    return json(
      { error: "Please use a JPG, PNG, WebP, GIF or AVIF picture." },
      400,
    );
  if (file.size > MAX_BYTES)
    return json({ error: "That picture is too big (max 4 MB)." }, 400);

  const path = `${randomUUID()}.${ext}`;
  const db = serverDb();
  const { error } = await db.storage
    .from(IMAGE_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) return json({ error: error.message }, 500);
  const { data } = db.storage.from(IMAGE_BUCKET).getPublicUrl(path);
  return json({ url: data.publicUrl });
}
