import { connection } from "next/server";
import { getPublicItems } from "@/lib/items";

// Guests' live list. Only safe columns, read with the restricted key.
export async function GET() {
  await connection();
  try {
    return Response.json(
      { items: await getPublicItems() },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json({ error: "Could not load gifts." }, { status: 500 });
  }
}
