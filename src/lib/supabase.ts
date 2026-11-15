import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requireEnv } from "./env";

const options = { auth: { persistSession: false, autoRefreshToken: false } };

/**
 * Guest client: uses the publishable (anon) key, so the database's
 * Row Level Security + column rules apply. It physically cannot read
 * the claimer's name or token.
 */
export function publicDb(): SupabaseClient {
  return createClient(
    requireEnv("SUPABASE_URL"),
    requireEnv("SUPABASE_PUBLISHABLE_KEY"),
    options,
  );
}

/**
 * Server client: uses the secret key. Only ever used inside API routes
 * on the server. Never import this from a "use client" file.
 */
export function serverDb(): SupabaseClient {
  return createClient(
    requireEnv("SUPABASE_URL"),
    requireEnv("SUPABASE_SECRET_KEY"),
    options,
  );
}

export const IMAGE_BUCKET = "item-images";
