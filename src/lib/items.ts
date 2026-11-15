import "server-only";
import { publicDb } from "./supabase";
import { PUBLIC_COLUMNS, type PublicItem } from "./types";

export async function getPublicItems(): Promise<PublicItem[]> {
  const { data, error } = await publicDb()
    .from("items")
    .select(PUBLIC_COLUMNS)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw new Error(`Could not load gifts: ${error.message}`);
  return (data ?? []) as PublicItem[];
}
