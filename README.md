# 🎁 Birthday Wishlist

A wishlist where friends claim gifts without logging in, and the birthday person can't see spoilers.

**Stack:** Next.js (App Router) · Supabase (database + picture storage) · Vercel · Framer Motion · canvas-confetti

## How it stays safe

| Rule | How it's enforced |
| --- | --- |
| Guests can't see who claimed what | The guest page reads the database with the *publishable* key, which can only read safe columns (`supabase/setup.sql`, column grants + Row Level Security). The claimer's name is never sent to the browser. |
| Two people tap at once → one wins | `claim_item()` does a single `UPDATE … WHERE claimed_at IS NULL`. Postgres lets exactly one through; the other gets "Someone just grabbed this one!" |
| Only the claimer can unclaim | On claim, the server makes a random token. The guest's browser keeps it (localStorage); the database keeps only its SHA-256 hash. `unclaim_item()` only works if the hash matches. |
| Guests can't add/edit/delete | No write policies exist for guests; writes only happen in `/api/admin/*` routes, which check the admin session cookie. |
| Admin password stays secret | `ADMIN_PASSWORD` lives only in server environment variables. Login sets a signed, httpOnly cookie. |
| No spoilers | `/api/admin/items` only includes claim info when "Reveal claims" is confirmed. |

## Setup (short version)

1. Create a Supabase project and run `supabase/setup.sql` in the SQL Editor.
2. Import this repo into Vercel and add the variables from `.env.example`.
3. Deploy, open `/admin`, log in, add gifts.

## Using the admin page (`/admin`)

- **Add:** tap **+ Add a gift**, fill in the name (price, link, picture are optional), then **Save**.
- **Edit:** tap **Edit** next to a gift, change anything, then **Save**.
- **Delete:** tap **Delete**, then confirm.
- **Reorder:** use the ▲ ▼ arrows.
- **Pictures:** **Upload a photo** (big photos get shrunk automatically) or paste an image link.
- **Reveal claims:** shows who's getting what, after an "Are you sure?" popup. **Hide claims again** turns spoilers off.
- **clear** (only visible while revealed): puts a claimed gift back on the list, for example if a guest lost their phone and can't unclaim.

## Local development (optional)

```bash
cp .env.example .env.local   # fill in real values
npm install
npm run dev
```
