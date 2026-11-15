// The secret "I claimed this" tokens live only in this browser (localStorage).
// Exposed as a tiny store so React can subscribe to it safely.
const KEY = "wishlist-claims-v1";
const NAME_KEY = "wishlist-guest-name";

export type ClaimTokens = Record<string, string>;

const EMPTY: ClaimTokens = {};
let cache: ClaimTokens | null = null;
const listeners = new Set<() => void>();

function read(): ClaimTokens {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export const tokenStore = {
  subscribe(fn: () => void) {
    listeners.add(fn);
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) {
        cache = null;
        fn();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(fn);
      window.removeEventListener("storage", onStorage);
    };
  },
  getSnapshot(): ClaimTokens {
    if (!cache) cache = read();
    return cache;
  },
  getServerSnapshot(): ClaimTokens {
    return EMPTY;
  },
  update(fn: (t: ClaimTokens) => ClaimTokens) {
    const next = fn(tokenStore.getSnapshot());
    cache = next;
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
    listeners.forEach((l) => l());
  },
};

export function loadName(): string {
  try {
    return localStorage.getItem(NAME_KEY) ?? "";
  } catch {
    return "";
  }
}

export function saveName(name: string) {
  try {
    localStorage.setItem(NAME_KEY, name);
  } catch {}
}
