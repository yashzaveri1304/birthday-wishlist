import { connection } from "next/server";
import { serverDb } from "@/lib/supabase";
import { isAdmin, json, unauthorized } from "@/lib/security";
import { ADMIN_COLUMNS, ADMIN_REVEAL_COLUMNS } from "@/lib/types";
import { validateItem } from "./validate";

// List gifts. Claim info is only included when ?reveal=1 ("no spoilers" by default).
export async function GET(req: Request) {
  await connection();
  if (!(await isAdmin())) return unauthorized();
  const reveal = new URL(req.url).searchParams.get("reveal") === "1";
  const { data, error } = await serverDb()
    .from("items")
    .select(reveal ? ADMIN_REVEAL_COLUMNS : ADMIN_COLUMNS)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) return json({ error: error.message }, 500);
  return json({ items: data });
}

// Add a gift (goes to the end of the list).
export async function POST(req: Request) {
  if (!(await isAdmin())) return unauthorized();
  const result = validateItem(await req.json().catch(() => null));
  if ("error" in result) return json(result, 400);

  const db = serverDb();
  const { data: last } = await db
    .from("items")
    .select("position")
    .order("position", { ascending: false })
    .limit(1);
  const position = (last?.[0]?.position ?? -1) + 1;

  const { data, error } = await db
    .from("items")
    .insert({ ...result.fields, position })
    .select(ADMIN_COLUMNS)
    .single();
  if (error) return json({ error: error.message }, 500);
  return json({ item: data });
}
