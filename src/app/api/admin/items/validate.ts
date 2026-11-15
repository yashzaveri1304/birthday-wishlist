type Fields = {
  name: string;
  price: string | null;
  link: string | null;
  image_url: string | null;
};

const clean = (v: unknown, max: number) => {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t.slice(0, max) : null;
};

const isHttpUrl = (v: string) => {
  try {
    const u = new URL(v);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
};

export function validateItem(
  body: unknown,
): { fields: Fields } | { error: string } {
  const b = (body ?? {}) as Record<string, unknown>;
  const name = clean(b.name, 120);
  if (!name) return { error: "Every gift needs a name." };
  const price = clean(b.price, 40);
  const link = clean(b.link, 2000);
  const image_url = clean(b.image_url, 1000);
  if (link && !isHttpUrl(link))
    return { error: "The shop link should start with https://" };
  if (image_url && !isHttpUrl(image_url))
    return { error: "The picture link should start with https://" };
  return { fields: { name, price, link, image_url } };
}
