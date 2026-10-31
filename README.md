# Nompong Studio — frontend

## New: LINE sticker set builder, TH/EN and dark mode

- **Sticker set builder** (`/suggest`, linked as "ออกแบบสติกเกอร์" in the menu, Explore, Home and the footer):
  pick 8/16/24/32/40 stickers, give the set a Thai and English name and description, then fill in a word and
  Nompong's pose/style for each sticker on big swipeable cards. Sets are saved in the visitor's browser for now
  (`src/features/suggestions/store.ts`); a Supabase adapter can replace that later.
- **TH/EN switch** and **light/dark switch** in the header. Both are remembered per device. The builder and the
  menu are fully translated; the older page copy is still Thai only. Builder text lives in `src/lib/copy.ts`.
- **Artwork:** put `character-sheet.png` in `public/nompong/` (see the README there). Until then a drawn stand-in shows.
- **Dev port:** `npm run dev` uses 5210, or `PORT` if set (so a second preview can run beside it).

Frontend MVP for **nompong family / Nompong Studio** built from `nompong_studio_frontend_spec.md` v1.0.
It runs against a **typed mock backend** (the spec's backend and database are still to come), so the whole
app works offline with demo data.

```bash
npm install
npm run dev          # http://localhost:5210
npm test             # Vitest unit tests (domain rules, mock contract, IndexedDB store)
npm run test:e2e     # Playwright acceptance tests (uses local Google Chrome)
npm run build
```

## Demo accounts (mock sign-in, no passwords)

| Persona | Role | Use it to try |
|---|---|---|
| พลอย | member | Community ideas, a request with "clarification requested", votes |
| เมย์ | customer | No sample requests (commission work was removed) |
| แอดมินสตูดิโอ | admin | Inbox, status transitions, production workspace, catalog, settings |

The yellow **test-mode bar** at the top has switches to simulate the server being offline and to reset all demo data.

## What's built (spec mapping)

- **Studio wizard** (§6): 5 steps, 8/16/24/32/40 slots, one sticker at a time on mobile and a two-pane layout on desktop,
  bulk paste with a preview, copy between slots, accessible reorder, a warning when the sticker count goes down
  (hidden slots are kept), inline errors, and a review page with jump links to each missing slot.
- **Drafts never lost** (§6.5, §13): edits go to IndexedDB right away, then sync to the server with version numbers.
  The status shows Saving / Saved / Offline / Sync failed. The draft id lives in the URL, so a refresh reopens the
  same draft. Create and submit are idempotent. A dialog resolves conflicts between local and server versions.
  Guest drafts are moved into the account at sign-in, and sign-out offers to clear drafts on shared devices.
- **Thai text** (FE-03): captions are never trimmed, normalised or autocorrected, and length limits count grapheme clusters.
- **Customer workspace** (§7, §8): dashboard, request list (local-only drafts included), detail page with milestones and
  timeline, clarification resubmit, and proof review (approve or revise per image, a comment is required to revise,
  compare versions, and approve the whole set only after every image is approved, with the exact versions recorded).
- **Admin** (§10): metrics, inbox (table on desktop, cards on mobile, saved views), request detail (transitions that
  require a message or LINE URL where needed, internal notes, assignment, brief snapshots), production (per-sticker stage,
  upload versions, QA checklist, proof release blocked until complete), V/M/CR/INTRO catalog, packages, audit log.
- **Public** (§9): home, about + Foundation `INTRO01`, catalog with separate series tabs and search, set detail
  (the LINE Store link appears only once live), wallpapers that export at the real resolution, a voting ideas board,
  shop/cards shells (no fake stock), and FAQ/terms/privacy.
- Mobile bottom nav, desktop top nav, collapsible admin sidebar, 44px touch targets, safe-area sticky bars,
  skip link, visible focus, statuses shown as icon + text, `prefers-reduced-motion`, PWA manifest + service worker,
  per-route meta tags, and analytics events that never include caption text.

## Architecture

```
src/lib/api/services.ts   service contract (spec §11) — components depend only on this
src/lib/api/mock/         mock adapter: localStorage "server", latency, offline, auth checks
src/lib/api/index.ts      adapter selection — add the real HTTP adapter here
src/lib/storage/drafts.ts IndexedDB device draft store (idb-keyval)
src/lib/validation/       Zod brief rules + grapheme-aware limits
src/lib/domain/status.ts  request lifecycle mirror (backend owns the real one)
src/features/studio/      wizard, draft model (pure functions) and useDraftEditor sync hook
```

Deviation from §12: the wizard uses its own persisted draft model + Zod instead of React Hook Form, because the
form state is a long-lived document synced to IndexedDB/server rather than a transient form.

## Not done / needs decisions

- **No real artwork.** Every image is a stamped `PLACEHOLDER`, and the character art slots wait for the approved master reference (§18.5).
- **Mock backend only.** The real auth, upload, protected media and notification work is in the backend spec (§17).
- English UI is partial (`src/locales/en.json`); long-form page copy is still inline Thai.
- Light theme only (spec: dark mode later). Policy text and package prices are draft placeholders.
- Open decisions in §18 (rights/credit, sign-in vs invitation links, LINE specs) are still unresolved.
