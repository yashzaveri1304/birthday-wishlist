"use client";
import { AnimatePresence, motion } from "framer-motion";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { PublicItem } from "@/lib/types";
import { GiftCard } from "./GiftCard";
import { Modal } from "./Modal";
import {
  loadName,
  saveName,
  tokenStore,
  type ClaimTokens,
} from "./claims-storage";

type ClaimState =
  | { item: PublicItem; phase: "form" | "loading"; error?: string }
  | { item: PublicItem; phase: "lost" };

const CONFETTI_COLORS = ["#f7ccd8", "#eba2b7", "#c24f7a", "#e9c9a8", "#ffffff"];

async function celebrate(el: HTMLElement | null) {
  // Loaded only when needed; runs after the claim already succeeded.
  if (typeof navigator !== "undefined" && "vibrate" in navigator)
    navigator.vibrate?.(25);
  const confetti = (await import("canvas-confetti")).default;
  const rect = el?.getBoundingClientRect();
  const origin = rect
    ? {
        x: (rect.left + rect.width / 2) / window.innerWidth,
        y: (rect.top + rect.height * 0.45) / window.innerHeight,
      }
    : { x: 0.5, y: 0.5 };
  // Soft rose petals instead of generic confetti.
  const petal = confetti.shapeFromPath({
    path: "M6 0 C10 3 12 8 6 16 C0 8 2 3 6 0 Z",
  });
  const shared = {
    origin,
    colors: CONFETTI_COLORS,
    disableForReducedMotion: true,
    shapes: [petal, "circle" as const],
    ticks: 260,
    gravity: 0.55,
    decay: 0.92,
    drift: 0.4,
  };
  confetti({
    ...shared,
    particleCount: 46,
    spread: 70,
    startVelocity: 30,
    scalar: 1.4,
  });
  confetti({
    ...shared,
    particleCount: 24,
    spread: 110,
    startVelocity: 22,
    scalar: 0.9,
    drift: -0.4,
  });
}

export function GiftList({ initialItems }: { initialItems: PublicItem[] }) {
  const [items, setItems] = useState(initialItems);
  const tokens = useSyncExternalStore(
    tokenStore.subscribe,
    tokenStore.getSnapshot,
    tokenStore.getServerSnapshot,
  );
  const [claim, setClaim] = useState<ClaimState | null>(null);
  const [name, setName] = useState("");
  const [unclaimItem, setUnclaimItem] = useState<PublicItem | null>(null);
  const [unclaimBusy, setUnclaimBusy] = useState(false);
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [unclaimError, setUnclaimError] = useState("");
  const cardRefs = useRef<Record<string, HTMLElement | null>>({});

  const updateTokens = tokenStore.update;

  const markItem = (id: string, is_claimed: boolean) =>
    setItems((list) =>
      list.map((it) => (it.id === id ? { ...it, is_claimed } : it)),
    );

  // Keep the list fresh so guests see what others just claimed.
  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/items", { cache: "no-store" });
      if (!res.ok) return;
      const { items: fresh } = (await res.json()) as { items: PublicItem[] };
      setItems(fresh);
      // Forget tokens for items that are no longer claimed (e.g. host cleared it).
      tokenStore.update((t) => {
        const next: ClaimTokens = {};
        for (const it of fresh)
          if (it.is_claimed && t[it.id]) next[it.id] = t[it.id];
        return next;
      });
    } catch {}
  }, []);

  useEffect(() => {
    const interval = setInterval(
      () => document.visibilityState === "visible" && refresh(),
      20000,
    );
    const onVisible = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  async function submitClaim(e: React.FormEvent) {
    e.preventDefault();
    if (!claim || claim.phase !== "form") return;
    const item = claim.item;
    const trimmed = name.trim();
    if (!trimmed)
      return setClaim({
        item,
        phase: "form",
        error: "Please type your name first.",
      });

    setClaim({ item, phase: "loading" });
    try {
      const res = await fetch("/api/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item.id, name: trimmed }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.token) {
        saveName(trimmed);
        updateTokens((t) => ({ ...t, [item.id]: data.token }));
        markItem(item.id, true);
        setClaim(null);
        celebrate(cardRefs.current[item.id]);
      } else if (res.status === 409) {
        markItem(item.id, true);
        setClaim({ item, phase: "lost" });
      } else {
        setClaim({
          item,
          phase: "form",
          error: data.error ?? "Something went wrong. Please try again.",
        });
      }
    } catch {
      setClaim({
        item,
        phase: "form",
        error: "No connection. Please try again.",
      });
    }
  }

  async function confirmUnclaim() {
    if (!unclaimItem) return;
    const token = tokens[unclaimItem.id];
    setUnclaimBusy(true);
    setUnclaimError("");
    try {
      const res = await fetch("/api/unclaim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: unclaimItem.id, token }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        const id = unclaimItem.id;
        updateTokens((t) =>
          Object.fromEntries(Object.entries(t).filter(([k]) => k !== id)),
        );
        markItem(unclaimItem.id, false);
        setUnclaimItem(null);
      } else {
        setUnclaimError(
          data.error ?? "Something went wrong. Please try again.",
        );
      }
    } catch {
      setUnclaimError("No connection. Please try again.");
    } finally {
      setUnclaimBusy(false);
    }
  }

  const closeClaim = useCallback(
    () => setClaim((c) => (c?.phase === "loading" ? c : null)),
    [],
  );
  const closeUnclaim = useCallback(
    () => !unclaimBusy && setUnclaimItem(null),
    [unclaimBusy],
  );

  if (items.length === 0) {
    return (
      <p className="mx-auto max-w-sm text-center font-display text-xl text-ink-soft italic">
        Gifts are still being added. Check back soon.
      </p>
    );
  }

  const openCount = items.filter((i) => !i.is_claimed).length;

  return (
    <>
      <div className="mb-9 flex flex-col items-center gap-4 border-t border-line pt-8 sm:mb-11 sm:flex-row sm:justify-between">
        <p className="text-sm text-ink-soft">
          {openCount === 0
            ? "Every gift has been claimed. Thank you, everyone."
            : `${openCount} of ${items.length} gifts still available`}
        </p>
        {openCount > 0 && openCount < items.length && (
          <div
            role="radiogroup"
            aria-label="Show gifts"
            className="inline-flex rounded-full bg-petal p-1"
          >
            {[
              { value: false, label: "All gifts" },
              { value: true, label: "Still available" },
            ].map((opt) => {
              const active = onlyOpen === opt.value;
              return (
                <button
                  key={opt.label}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setOnlyOpen(opt.value)}
                  className={`relative min-h-10 rounded-full px-4 text-sm transition-colors ${active ? "text-ink" : "text-ink-soft hover:text-ink"}`}
                >
                  {active && (
                    <motion.span
                      layoutId="filter-pill"
                      className="absolute inset-0 rounded-full bg-white shadow-[0_4px_14px_-6px_rgba(166,60,100,0.35)]"
                      transition={{
                        type: "spring",
                        stiffness: 420,
                        damping: 34,
                      }}
                    />
                  )}
                  <span className="relative">{opt.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-11 sm:gap-x-7 sm:gap-y-14 lg:grid-cols-3">
        <AnimatePresence mode="popLayout" initial={false}>
          {items
            .filter(
              (item) =>
                !onlyOpen || !item.is_claimed || Boolean(tokens[item.id]),
            )
            .map((item, i) => (
              <GiftCard
                key={item.id}
                ref={(el) => {
                  cardRefs.current[item.id] = el;
                }}
                item={item}
                index={i}
                mine={item.is_claimed && Boolean(tokens[item.id])}
                onClaim={() => {
                  if (!name) setName(loadName());
                  setClaim({ item, phase: "form" });
                }}
                onUnclaim={() => {
                  setUnclaimError("");
                  setUnclaimItem(item);
                }}
              />
            ))}
        </AnimatePresence>
      </div>

      {/* Claim popup */}
      <Modal
        open={Boolean(claim)}
        onClose={closeClaim}
        title={claim?.phase === "lost" ? "Oh no, so close!" : "Lovely choice!"}
      >
        {claim?.phase === "lost" ? (
          <div className="space-y-5">
            <p className="text-ink-soft">
              Someone just grabbed this one! Have a look at the other gifts,
              there’s still plenty to choose from.
            </p>
            <button
              type="button"
              onClick={() => setClaim(null)}
              className="w-full rounded-full bg-ink py-3.5 font-semibold text-cream"
            >
              Back to the list
            </button>
          </div>
        ) : claim ? (
          <form onSubmit={submitClaim} className="space-y-4">
            <p className="text-ink-soft">
              You’re getting{" "}
              <strong className="text-ink">{claim.item.name}</strong>. Only the
              birthday person can ever see your name, and only if they choose to
              peek.
            </p>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink">
                Your name
              </span>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={60}
                autoComplete="name"
                placeholder="e.g. Priya"
                className="w-full rounded-2xl border border-line bg-white px-4 py-3.5 text-base text-ink outline-none transition-shadow placeholder:text-ink-soft/50 focus:border-coral focus:ring-4 focus:ring-coral/15"
              />
            </label>
            {"error" in claim && claim.error && (
              <p role="alert" className="text-sm font-medium text-coral-deep">
                {claim.error}
              </p>
            )}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={closeClaim}
                disabled={claim.phase === "loading"}
                className="flex-1 rounded-full border border-line bg-white py-3.5 font-medium text-ink-soft disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={claim.phase === "loading"}
                className="flex flex-[1.6] items-center justify-center gap-2 rounded-full bg-coral py-3.5 font-semibold text-white transition-colors hover:bg-coral-deep disabled:opacity-90"
              >
                {claim.phase === "loading" ? (
                  <>
                    <span className="spinner" aria-hidden />{" "}
                    <span className="sr-only">Claiming…</span>
                  </>
                ) : (
                  "I’ll get this"
                )}
              </button>
            </div>
          </form>
        ) : null}
      </Modal>

      {/* Unclaim confirmation */}
      <Modal
        open={Boolean(unclaimItem)}
        onClose={closeUnclaim}
        title="Give this one back?"
      >
        <div className="space-y-4">
          <p className="text-ink-soft">
            <strong className="text-ink">{unclaimItem?.name}</strong> will go
            back on the list so someone else can pick it.
          </p>
          {unclaimError && (
            <p role="alert" className="text-sm font-medium text-coral-deep">
              {unclaimError}
            </p>
          )}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={closeUnclaim}
              className="flex-1 rounded-full border border-line bg-white py-3.5 font-medium text-ink-soft"
            >
              Keep it
            </button>
            <button
              type="button"
              onClick={confirmUnclaim}
              disabled={unclaimBusy}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-ink py-3.5 font-semibold text-cream"
            >
              {unclaimBusy ? (
                <span className="spinner" aria-label="Working" />
              ) : (
                "Yes, unclaim"
              )}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
