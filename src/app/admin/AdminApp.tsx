"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { Modal } from "@/components/Modal";
import { Bow } from "@/components/Bow";
import type { AdminItem } from "@/lib/types";
import { resizeImage } from "./resize";

type Draft = {
  id?: string;
  name: string;
  price: string;
  link: string;
  image_url: string;
};
const emptyDraft: Draft = { name: "", price: "", link: "", image_url: "" };

const btn =
  "rounded-full px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50";
const input =
  "w-full rounded-2xl border border-line bg-white px-4 py-3 text-base text-ink outline-none focus:border-coral focus:ring-4 focus:ring-coral/15";

async function api<T = Record<string, unknown>>(
  url: string,
  init?: RequestInit,
): Promise<{ ok: boolean; status: number; data: T }> {
  const res = await fetch(url, { cache: "no-store", ...init });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}
const jsonInit = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export function AdminApp() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [items, setItems] = useState<AdminItem[]>([]);
  const [reveal, setReveal] = useState(false);
  const [askReveal, setAskReveal] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [formOpen, setFormOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const openForm = (d: Draft) => {
    setDraft(d);
    setFormKey((k) => k + 1);
    setFormOpen(true);
  };
  const [toDelete, setToDelete] = useState<AdminItem | null>(null);
  const [toRelease, setToRelease] = useState<AdminItem | null>(null);
  const [notice, setNotice] = useState("");

  const load = useCallback(async (withClaims: boolean) => {
    const { ok, status, data } = await api<{
      items: AdminItem[];
      error?: string;
    }>(`/api/admin/items${withClaims ? "?reveal=1" : ""}`);
    if (status === 401) return setAuthed(false);
    setAuthed(true);
    if (ok) setItems(data.items);
    else setNotice(data.error ?? "Could not load gifts.");
  }, []);

  useEffect(() => {
    let cancelled = false;
    api<{ items: AdminItem[] }>("/api/admin/items").then(
      ({ ok, status, data }) => {
        if (cancelled) return;
        setAuthed(status !== 401);
        if (ok) setItems(data.items);
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const flash = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(""), 3000);
  };

  async function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);
    const { ok, status } = await api(
      "/api/admin/reorder",
      jsonInit("POST", { ids: next.map((i) => i.id) }),
    );
    if (status === 401) setAuthed(false);
    else if (!ok) flash("Couldn’t save the new order.");
  }

  async function doDelete() {
    if (!toDelete) return;
    const { ok } = await api(`/api/admin/items/${toDelete.id}`, {
      method: "DELETE",
    });
    if (ok) {
      setItems((l) => l.filter((i) => i.id !== toDelete.id));
      flash("Gift removed.");
    } else flash("Couldn’t delete that gift.");
    setToDelete(null);
  }

  async function doRelease() {
    if (!toRelease) return;
    const { ok } = await api(
      "/api/admin/release",
      jsonInit("POST", { itemId: toRelease.id }),
    );
    if (ok) {
      await load(true);
      flash("Claim cleared. It’s back on the list.");
    } else flash("Couldn’t clear that claim.");
    setToRelease(null);
  }

  async function logout() {
    await api("/api/admin/logout", { method: "POST" });
    setAuthed(false);
    setItems([]);
    setReveal(false);
  }

  if (authed === null) return <div className="min-h-dvh" />;
  if (!authed) return <Login onDone={() => load(false)} />;

  return (
    <div className="mx-auto min-h-dvh max-w-3xl px-4 pb-24 pt-8 sm:px-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">
            Your wishlist
          </h1>
          <p className="text-sm text-ink-soft">
            {items.length} gift{items.length === 1 ? "" : "s"} ·{" "}
            <a
              href="/"
              target="_blank"
              className="underline underline-offset-4"
            >
              view guest page ↗
            </a>
          </p>
        </div>
        <button
          onClick={logout}
          className={`${btn} border border-line bg-white text-ink-soft`}
        >
          Log out
        </button>
      </header>

      <div className="sticky top-0 z-20 -mx-4 mb-5 flex flex-wrap gap-2 bg-cream/95 px-4 py-3 sm:-mx-6 sm:px-6">
        <button
          onClick={() => openForm({ ...emptyDraft })}
          className={`${btn} bg-coral text-white hover:bg-coral-deep`}
        >
          + Add a gift
        </button>
        {reveal ? (
          <button
            onClick={() => {
              setReveal(false);
              load(false);
            }}
            className={`${btn} bg-ink text-cream`}
          >
            🙈 Hide claims again
          </button>
        ) : (
          <button
            onClick={() => setAskReveal(true)}
            className={`${btn} border border-line bg-white text-ink`}
          >
            👀 Reveal claims
          </button>
        )}
      </div>

      <p className="mb-4 rounded-2xl bg-petal px-4 py-3 text-sm text-ink-soft">
        {reveal
          ? "Spoilers are ON: you can see who is getting what."
          : "No-spoilers mode is on: you can’t see what has been claimed. Your surprise is safe."}
      </p>

      {items.length === 0 && (
        <p className="rounded-3xl bg-petal p-8 text-center text-ink-soft">
          No gifts yet. Tap “Add a gift” to start.
        </p>
      )}

      <ul className="space-y-3">
        <AnimatePresence initial={false}>
          {items.map((item, i) => (
            <motion.li
              key={item.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 400, damping: 34 }}
              className="flex items-center gap-3 rounded-3xl border border-line bg-white p-3"
            >
              <div className="flex flex-col">
                <button
                  aria-label="Move up"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="h-8 w-8 rounded-full text-ink-soft hover:bg-petal disabled:opacity-25"
                >
                  ▲
                </button>
                <button
                  aria-label="Move down"
                  onClick={() => move(i, 1)}
                  disabled={i === items.length - 1}
                  className="h-8 w-8 rounded-full text-ink-soft hover:bg-petal disabled:opacity-25"
                >
                  ▼
                </button>
              </div>
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-petal">
                {item.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.image_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Bow className="w-3/4" idPrefix="admin" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-ink">{item.name}</p>
                <p className="truncate text-sm text-ink-soft">
                  {item.price || "No price"}
                </p>
                {reveal && (
                  <p className="mt-0.5 text-sm">
                    {item.is_claimed ? (
                      <span className="font-medium text-coral-deep">
                        🎁 {item.claimed_by_name}{" "}
                        <button
                          onClick={() => setToRelease(item)}
                          className="ml-1 rounded-full px-2 py-1 text-xs text-ink-soft underline"
                        >
                          clear
                        </button>
                      </span>
                    ) : (
                      <span className="text-ink-soft">Not claimed yet</span>
                    )}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 flex-col gap-1.5 sm:flex-row">
                <button
                  onClick={() =>
                    openForm({
                      id: item.id,
                      name: item.name,
                      price: item.price ?? "",
                      link: item.link ?? "",
                      image_url: item.image_url ?? "",
                    })
                  }
                  className={`${btn} border border-line bg-white text-ink`}
                >
                  Edit
                </button>
                <button
                  onClick={() => setToDelete(item)}
                  className={`${btn} text-coral-deep hover:bg-blush/40`}
                >
                  Delete
                </button>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={draft.id ? "Edit gift" : "Add a gift"}
      >
        <ItemForm
          key={formKey}
          draft={draft}
          onClose={() => setFormOpen(false)}
          onSaved={(saved, isNew) => {
            setItems((l) =>
              isNew
                ? [...l, saved]
                : l.map((i) => (i.id === saved.id ? { ...i, ...saved } : i)),
            );
            setFormOpen(false);
            flash(isNew ? "Gift added! 🎉" : "Saved.");
          }}
          onUnauthorized={() => setAuthed(false)}
        />
      </Modal>

      <Confirm
        open={askReveal}
        title="Are you sure?"
        body="This shows who claimed each gift. It might spoil the surprise!"
        yes="Yes, show me"
        onYes={() => {
          setAskReveal(false);
          setReveal(true);
          load(true);
        }}
        onNo={() => setAskReveal(false)}
      />
      <Confirm
        open={Boolean(toDelete)}
        title="Delete this gift?"
        body={`“${toDelete?.name ?? ""}” will be removed from your list for good.`}
        yes="Delete"
        danger
        onYes={doDelete}
        onNo={() => setToDelete(null)}
      />
      <Confirm
        open={Boolean(toRelease)}
        title="Clear this claim?"
        body={`“${toRelease?.name ?? ""}” goes back on the list. Only do this if ${toRelease?.claimed_by_name ?? "the guest"} asked you to.`}
        yes="Clear claim"
        onYes={doRelease}
        onNo={() => setToRelease(null)}
      />

      <AnimatePresence>
        {notice && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-x-0 bottom-6 z-50 mx-auto w-fit rounded-full bg-ink px-5 py-3 text-sm font-medium text-cream shadow-xl"
            role="status"
          >
            {notice}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Login({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { ok, data } = await api<{ error?: string }>(
      "/api/admin/login",
      jsonInit("POST", { password }),
    );
    setBusy(false);
    if (ok) onDone();
    else setError(data.error ?? "Wrong password.");
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <motion.form
        onSubmit={submit}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-4 rounded-[2rem] border border-line bg-white p-7 shadow-xl"
      >
        <h1 className="font-display text-3xl font-semibold text-ink">
          Admin 🔐
        </h1>
        <p className="text-sm text-ink-soft">
          Only the birthday person gets past this door.
        </p>
        <input
          type="password"
          autoFocus
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className={input}
        />
        {error && (
          <p role="alert" className="text-sm font-medium text-coral-deep">
            {error}
          </p>
        )}
        <button
          disabled={busy || !password}
          className={`${btn} flex w-full justify-center bg-ink py-3.5 text-base text-cream`}
        >
          {busy ? <span className="spinner" aria-label="Checking" /> : "Log in"}
        </button>
      </motion.form>
    </div>
  );
}

function ItemForm({
  draft,
  onClose,
  onSaved,
  onUnauthorized,
}: {
  draft: Draft;
  onClose: () => void;
  onSaved: (item: AdminItem, isNew: boolean) => void;
  onUnauthorized: () => void;
}) {
  const [form, setForm] = useState<Draft>(draft);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [filling, setFilling] = useState(false);
  const [fillNote, setFillNote] = useState("");

  async function fillFromLink() {
    setFilling(true);
    setFillNote("");
    setError("");
    const { ok, status, data } = await api<{
      name?: string;
      price?: string;
      image_url?: string;
      error?: string;
    }>("/api/admin/preview", jsonInit("POST", { url: form.link.trim() }));
    setFilling(false);
    if (status === 401) return onUnauthorized();
    if (!ok)
      return setFillNote(
        data.error ??
          "Couldn’t read that page. Please type the details instead.",
      );
    // Fill in what we found, without overwriting anything already typed.
    setForm((f) => ({
      ...f,
      name: f.name || data.name || "",
      price: f.price || data.price || "",
      image_url: f.image_url || data.image_url || "",
    }));
    const got = [
      data.name && "name",
      data.price && "price",
      data.image_url && "picture",
    ].filter(Boolean);
    setFillNote(
      `Filled in the ${got.join(", ")}. Check it looks right before saving.`,
    );
  }

  const set = (k: keyof Draft) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setError("");
    const body = new FormData();
    body.append("file", await resizeImage(file));
    const { ok, status, data } = await api<{ url?: string; error?: string }>(
      "/api/admin/upload",
      { method: "POST", body },
    );
    setUploading(false);
    if (status === 401) return onUnauthorized();
    if (ok && data.url) setForm((f) => ({ ...f, image_url: data.url! }));
    else setError(data.error ?? "Upload failed.");
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const isNew = !form.id;
    const { id, ...fields } = form;
    const { ok, status, data } = await api<{
      item?: AdminItem;
      error?: string;
    }>(
      isNew ? "/api/admin/items" : `/api/admin/items/${id}`,
      jsonInit(isNew ? "POST" : "PATCH", fields),
    );
    setBusy(false);
    if (status === 401) return onUnauthorized();
    if (ok && data.item) onSaved(data.item, isNew);
    else setError(data.error ?? "Couldn’t save.");
  }

  return (
    <form
      onSubmit={save}
      className="max-h-[70dvh] space-y-3 overflow-y-auto pb-1"
    >
      <div>
        <label htmlFor="gift-link" className="mb-1 block text-sm font-medium">
          Shop link
        </label>
        <div className="flex gap-2">
          <input
            id="gift-link"
            type="url"
            value={form.link}
            onChange={set("link")}
            className={input}
            placeholder="Paste a link from any shop"
          />
          <button
            type="button"
            onClick={fillFromLink}
            disabled={filling || !/^https?:\/\//i.test(form.link.trim())}
            className={`${btn} shrink-0 bg-blush text-ink hover:bg-satin`}
          >
            {filling ? (
              <span className="spinner" aria-label="Reading the shop page" />
            ) : (
              "Fill from link"
            )}
          </button>
        </div>
        {fillNote && <p className="mt-1.5 text-xs text-ink-soft">{fillNote}</p>}
      </div>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Name *</span>
        <input
          required
          maxLength={120}
          value={form.name}
          onChange={set("name")}
          className={input}
          placeholder="Noise-cancelling headphones"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Price</span>
        <input
          maxLength={40}
          value={form.price}
          onChange={set("price")}
          className={input}
          placeholder="₹2,499 or $30"
        />
      </label>

      <div>
        <span className="mb-1 block text-sm font-medium">
          Picture (optional)
        </span>
        <div className="flex items-center gap-3">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-petal">
            {form.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={form.image_url}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Bow className="w-3/4" idPrefix="admin" />
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <label
              className={`${btn} cursor-pointer border border-line bg-white text-center text-ink`}
            >
              {uploading ? "Uploading…" : "Upload a photo"}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={upload}
                disabled={uploading}
              />
            </label>
            {form.image_url && (
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, image_url: "" }))}
                className="text-xs text-ink-soft underline"
              >
                Remove picture
              </button>
            )}
          </div>
        </div>
        <input
          type="url"
          value={form.image_url}
          onChange={set("image_url")}
          className={`${input} mt-2 text-sm`}
          placeholder="…or paste an image link (https://…)"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm font-medium text-coral-deep">
          {error}
        </p>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className={`${btn} flex-1 border border-line bg-white py-3 text-ink-soft`}
        >
          Cancel
        </button>
        <button
          disabled={busy || uploading}
          className={`${btn} flex flex-1 justify-center bg-coral py-3 text-white`}
        >
          {busy ? <span className="spinner" aria-label="Saving" /> : "Save"}
        </button>
      </div>
    </form>
  );
}

function Confirm(props: {
  open: boolean;
  title: string;
  body: string;
  yes: string;
  danger?: boolean;
  onYes: () => void;
  onNo: () => void;
}) {
  return (
    <Modal open={props.open} onClose={props.onNo} title={props.title}>
      <p className="text-ink-soft">{props.body}</p>
      <div className="mt-5 flex gap-3">
        <button
          onClick={props.onNo}
          className={`${btn} flex-1 border border-line bg-white py-3 text-ink-soft`}
        >
          Cancel
        </button>
        <button
          onClick={props.onYes}
          className={`${btn} flex-1 py-3 text-white ${props.danger ? "bg-coral-deep" : "bg-ink"}`}
        >
          {props.yes}
        </button>
      </div>
    </Modal>
  );
}
