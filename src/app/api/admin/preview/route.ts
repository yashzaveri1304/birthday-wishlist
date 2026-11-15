import { randomUUID } from "node:crypto";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { serverDb, IMAGE_BUCKET } from "@/lib/supabase";
import { isAdmin, json, unauthorized } from "@/lib/security";

// Admin-only: read a shop page and suggest the gift's name, price and picture.
// Only public http(s) websites are fetched (no private/internal addresses).

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";
const MAX_HTML = 1_500_000;
const MAX_IMAGE = 4 * 1024 * 1024;
const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

function isPrivateIp(ip: string): boolean {
  if (isIP(ip) === 6) {
    const v = ip.toLowerCase();
    if (
      v === "::1" ||
      v === "::" ||
      v.startsWith("fc") ||
      v.startsWith("fd") ||
      v.startsWith("fe80")
    )
      return true;
    const mapped = v.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    return mapped ? isPrivateIp(mapped[1]) : false;
  }
  const [a, b] = ip.split(".").map(Number);
  return (
    a === 10 ||
    a === 127 ||
    a === 0 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127) ||
    a >= 224
  );
}

async function assertPublicUrl(raw: string): Promise<URL> {
  const url = new URL(raw);
  if (url.protocol !== "https:" && url.protocol !== "http:")
    throw new Error("bad protocol");
  if (url.username || url.password) throw new Error("credentials in url");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (
    host === "localhost" ||
    host.endsWith(".local") ||
    host.endsWith(".internal")
  )
    throw new Error("private host");
  const addrs = isIP(host)
    ? [{ address: host }]
    : await lookup(host, { all: true });
  if (addrs.length === 0 || addrs.some((a) => isPrivateIp(a.address)))
    throw new Error("private address");
  return url;
}

/** fetch() that re-checks every redirect hop against the public-address rule. */
async function safeFetch(raw: string, accept: string): Promise<Response> {
  let current = raw;
  for (let hop = 0; hop < 5; hop++) {
    const url = await assertPublicUrl(current);
    const res = await fetch(url, {
      redirect: "manual",
      headers: {
        "User-Agent": UA,
        Accept: accept,
        "Accept-Language": "en-IN,en;q=0.9",
      },
      signal: AbortSignal.timeout(8000),
    });
    const next = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && next) {
      current = new URL(next, url).toString();
      continue;
    }
    return res;
  }
  throw new Error("too many redirects");
}

async function readCapped(
  res: Response,
  max: number,
): Promise<Uint8Array | null> {
  const reader = res.body?.getReader();
  if (!reader) return null;
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > max) {
      await reader.cancel();
      return max === MAX_HTML ? concat(chunks) : null; // HTML: keep what we have
    }
    chunks.push(value);
  }
  return concat(chunks);
}

function concat(chunks: Uint8Array[]) {
  const out = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0));
  let o = 0;
  for (const c of chunks) {
    out.set(c, o);
    o += c.length;
  }
  return out;
}

const decode = (s: string) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, " ")
    .trim();

function meta(html: string, key: string): string | null {
  const re = new RegExp(
    `<meta[^>]+(?:property|name|itemprop)=["']${key}["'][^>]*content=["']([^"']+)["']|<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name|itemprop)=["']${key}["']`,
    "i",
  );
  const m = html.match(re);
  return m ? decode(m[1] ?? m[2]) : null;
}

type Found = { name?: string; price?: string; image?: string };

function fromJsonLd(html: string): Found {
  const out: Found = {};
  const blocks =
    html.match(
      /<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi,
    ) ?? [];
  const visit = (node: unknown) => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) return node.forEach(visit);
    const o = node as Record<string, unknown>;
    const type = o["@type"];
    if (
      type === "Product" ||
      (Array.isArray(type) && type.includes("Product"))
    ) {
      if (!out.name && typeof o.name === "string") out.name = decode(o.name);
      const img = Array.isArray(o.image) ? o.image[0] : o.image;
      if (!out.image && typeof img === "string") out.image = img;
      if (
        !out.image &&
        img &&
        typeof img === "object" &&
        typeof (img as { url?: unknown }).url === "string"
      )
        out.image = (img as { url: string }).url;
      const offers = Array.isArray(o.offers) ? o.offers[0] : o.offers;
      if (!out.price && offers && typeof offers === "object") {
        const of = offers as Record<string, unknown>;
        const amount = of.price ?? of.lowPrice;
        if (amount !== undefined)
          out.price = formatPrice(
            String(amount),
            String(of.priceCurrency ?? ""),
          );
      }
    }
    Object.values(o).forEach(visit);
  };
  for (const b of blocks) {
    try {
      visit(JSON.parse(b.replace(/^<script[^>]*>|<\/script>$/gi, "")));
    } catch {}
  }
  return out;
}

const SYMBOLS: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  AED: "AED ",
};
function formatPrice(amount: string, currency: string) {
  const n = Number(String(amount).replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(n) || n <= 0) return undefined;
  const code = currency.toUpperCase();
  const num = n.toLocaleString(code === "INR" ? "en-IN" : "en-US", {
    maximumFractionDigits: n % 1 ? 2 : 0,
  });
  return `${SYMBOLS[code] ?? (code ? `${code} ` : "")}${num}`;
}

async function copyImage(imageUrl: string): Promise<string | null> {
  try {
    const res = await safeFetch(
      imageUrl,
      "image/avif,image/webp,image/*;q=0.8",
    );
    const type = (res.headers.get("content-type") ?? "").split(";")[0].trim();
    const ext = IMAGE_TYPES[type];
    if (!res.ok || !ext) return null;
    const bytes = await readCapped(res, MAX_IMAGE);
    if (!bytes) return null;
    const path = `${randomUUID()}.${ext}`;
    const db = serverDb();
    const { error } = await db.storage
      .from(IMAGE_BUCKET)
      .upload(path, bytes, { contentType: type });
    if (error) return null;
    return db.storage.from(IMAGE_BUCKET).getPublicUrl(path).data.publicUrl;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  if (!(await isAdmin())) return unauthorized();
  const body = await req.json().catch(() => null);
  const link = typeof body?.url === "string" ? body.url.trim() : "";
  if (!/^https?:\/\//i.test(link) || link.length > 2000)
    return json({ error: "Paste a shop link that starts with https://" }, 400);

  let html = "";
  let finalUrl = link;
  try {
    const res = await safeFetch(link, "text/html,application/xhtml+xml");
    finalUrl = res.url || link;
    const bytes = await readCapped(res, MAX_HTML);
    html = bytes ? new TextDecoder().decode(bytes) : "";
    if (!res.ok && !html) throw new Error(String(res.status));
  } catch {
    return json(
      {
        error:
          "That shop didn’t let us read the page. Please type the details instead.",
      },
      422,
    );
  }

  const ld = fromJsonLd(html);
  const titleTag = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1];
  const richName =
    ld.name ?? meta(html, "og:title") ?? meta(html, "twitter:title");
  const name = richName ?? (titleTag ? decode(titleTag) : undefined);
  const price =
    ld.price ??
    formatPrice(
      meta(html, "product:price:amount") ??
        meta(html, "og:price:amount") ??
        meta(html, "price") ??
        "",
      meta(html, "product:price:currency") ??
        meta(html, "og:price:currency") ??
        meta(html, "priceCurrency") ??
        "",
    );
  let image: string | null | undefined =
    ld.image ??
    meta(html, "og:image:secure_url") ??
    meta(html, "og:image") ??
    meta(html, "twitter:image");
  if (image) {
    try {
      image = new URL(image, finalUrl).toString();
    } catch {
      image = undefined;
    }
  }

  // Many big shops (e.g. Amazon) show robots a "blocked" page instead of the product.
  const blocked =
    /access denied|just a moment|captcha|robot check|attention required|are you a human|forbidden/i.test(
      name ?? "",
    ) ||
    (!richName && !price && !image);
  if (blocked) {
    return json(
      {
        error:
          "That shop blocks automatic reading. Please type the details and upload a picture instead.",
      },
      422,
    );
  }

  const copied = image ? await copyImage(image) : null;
  const result = {
    name: name ? name.slice(0, 120) : undefined,
    price: price ? price.slice(0, 40) : undefined,
    image_url: copied ?? undefined,
  };
  if (!result.name && !result.price && !result.image_url) {
    return json(
      {
        error: "Couldn’t find details on that page. Please type them instead.",
      },
      422,
    );
  }
  return json(result);
}
