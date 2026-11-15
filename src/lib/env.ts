import "server-only";

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing environment variable ${name}. Add it in Vercel (Settings → Environment Variables) or in .env.local.`,
    );
  }
  return value;
}
