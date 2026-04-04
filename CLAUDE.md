# CLAUDE.md

## What We're Building
A personal profile app — a digital scrapbook. Users build a bento grid 
profile made of widgets representing who they are. Books they're reading, 
movies they've watched, music they love, photos they've taken, items they 
collect, links they want to share. Think "your corner of the internet" — 
a beautiful personal page you share via link, like a living profile that 
builds itself from the things you already care about.

Public by default. People can follow each other and watch profiles update 
over time. No follower counts, no likes, no metrics. Ever.

The closest reference was Bento.me — which shut down February 2026 after 
being acquired by Linktree. We are filling that gap but going deeper — 
more personal, more curated, more beautiful by default.

---

## Stack
- **Web:** Next.js 14+ (App Router), Tailwind CSS, deployed on Vercel
- **Mobile:** React Native with Expo (built after web is stable)
- **Backend:** Supabase — one backend for both web and mobile, always
- **Auth:** Supabase Auth
- **Storage:** Supabase Storage for all media
- **External APIs:** TMDB (movies), Google Books (books), Spotify (music)
- **Typography:** Cormorant Garamond (serif, primary) + JetBrains Mono (monospace, labels/metadata)

---

## Rules
- One Supabase backend shared by web and mobile. Never split it.
- No separate API layer for now. Call Supabase directly from the frontend.
- App Router only. No pages directory.
- Never hardcode the app name. Use `[APPNAME]` as placeholder everywhere.
- `metadata` jsonb on items handles all type-specific fields. Do not create separate tables per content type.
- RLS always enabled. Users only access their own data unless a profile is public.
- Never put ads or metrics on profile pages.
- No follower counts, like counts, or any performance metrics visible on profiles.
- Keep components small and focused. No giant files.
- Mobile-first thinking even on web. Everything should feel warm and personal, not like a SaaS tool.
- Never use Inter, Roboto, Arial, or system fonts. Always Cormorant Garamond + JetBrains Mono.
- Every element should feel intentional. Nothing accidental, nothing default. If it looks like AI slop, redo it.

---

## Design System

### Aesthetic
White background. Warm, clean, minimal. Soft shadows. Rounded corners 
(14px on cards). Things look physical — books like books, photos like 
polaroids, albums like records. Typography is the personality of the app.

### Typography
- **Cormorant Garamond** — titles, book names, movie names, any content title. Serif. Primary font.
- **JetBrains Mono** — category labels, status pills, usernames, dates, metadata, counts. Monospace. Secondary font.
- Never mix in other fonts.

### Card System
Cards are the core UI unit. Three sizes:
- **1x1** — small square. Single item, compact.
- **1x2** — tall rectangle. 1 column wide, 2 rows tall.
- **2x1** — wide rectangle. 2 columns wide, 1 row tall.
- **2x2** — large square. Reserved for future use, not in MVP.

Card anatomy:
- Top: category label in JetBrains Mono, 9px, muted. Format: "Reading · Books" or "Listening · Music". Arrow ↗ top right.
- Content: depends on type (see Card Templates below)
- Status pill: JetBrains Mono, 8px, pill shape, colored by status
- Everything anchors to the bottom of the card.
- Cover/image floats with subtle box-shadow.
- Border: 0.5px solid #e0ddd8. No heavy shadows on the card itself.

### Card Templates (Locked)

**Books (all three sizes):**
- 1x1 — cover floats bottom-left with shadow, status pill + title + author anchored bottom-right. Cover is a proper book shape, not filling the whole side.
- 1x2 — cover fills top of card (large, dominant), status pill + title + author anchored at bottom.
- 2x1 — cover floats bottom-left, bleeds into bottom edge of card (cut off), title is large (24px+), info anchored bottom-right.

**Movies:** Reuse exact same templates as books. Poster instead of cover.

**Music:** Same templates as books. Album art instead of cover. Square album art instead of portrait book shape.

**Photos:**
- 1x1 — single photo fills card edge to edge.
- 1x2 — single photo fills card, label overlay at bottom.
- 2x1 — photo fills card, label overlay at bottom.

**Collections:**
- 1x2 vertical — stacked list of items with thumbnail, name, meta.
- 2x1 horizontal — items side by side, each in their own column with dividers between them. Thumbnail, name, meta, optional link.

### Color Palette (Preset, User Picks One)
Users choose from premade palettes. No custom colors. All palettes look good — users cannot break the design.

### Font Pairings (Preset, User Picks One)
Users choose from premade font pairings. No custom fonts.

### Status Pills
Colored pill badges in JetBrains Mono, 8px. Colors:
- Reading / Watching / On repeat — soft green bg, green text
- Read / Watched / Loved — soft gray bg, gray text
- Want to read / Want to watch / Want — soft yellow bg, yellow text
- Favorite — soft amber bg, amber text
- Discovered — soft blue bg, blue text

---

## Content Types & Status Tags

### Books
Fetched via Google Books API.
Fields: title, author, cover image, genre, status, date added, date finished, personal note.
Status tags: want to read, reading, read, favorite.

### Movies / TV
Fetched via TMDB API.
Fields: title, director, poster, genre, type (movie/TV), status, date added, date watched, personal note.
Status tags: want to watch, watching, watched, favorite.

### Music (song or album)
Fetched via Spotify API.
Fields: title, artist, album cover, type (song/album), status, date added, personal note.
Status tags: discovered, on repeat, loved, favorite.

### Photos
Uploaded by user to Supabase Storage.
Fields: image, title, date taken, location, date added, personal note.
No status tags.

### Items (watches, shoes, gear, anything physical)
User adds manually with optional link.
Fields: title, brand, image (uploaded or fetched from link), link to buy, price (optional), status, date added, personal note.
Status tags: want, own, favorite.

### Links (websites, YouTube, Instagram, articles)
User pastes URL. Metadata auto-fetched via open graph.
Fields: URL, title (auto, editable), preview image (auto), description (auto, editable), source type (auto-detected), date added, personal note.
No status tags.

---

## Library vs Profile

### Library
Everything the user has ever added lives here. Items exist independently — they do not have to belong to a collection. The library is private and organized by type.

Users can add to the library two ways:
1. Bottom up — add item to library first, then place on profile.
2. Top down — start from profile or collection, add items inline. They auto-save to library in background.

Top down is the default and primary flow. Most users will never open the library directly.

### Collections
A collection groups multiple items together. Collections can be mixed type — a movie, a song, and a book can all live in one collection. User names the collection themselves.

Collection types:
- **favorites** — ranked list, numbered, editorial feel
- **collection** — unranked grid of things
- **log** — running history, auto-grows
- **blog** — writing, notes and posts

### Profile
The public-facing bento grid. Users pull items or collections from their library and place them as widgets. Each widget has:
- A size (1x1, 1x2, 2x1)
- An optional personal title (e.g. "the book that changed me")
- A position on the grid

The personal title is set at the widget level, not the item level.

---

## Database Schema
```sql
users (
  id uuid primary key references auth.users(id),
  username text unique,
  full_name text,
  bio text,
  avatar_url text,
  header_image_url text,
  location text,
  color_palette text default 'default',
  font_pairing text default 'default',
  is_public boolean default true,
  created_at timestamptz default now()
)

collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  name text not null,
  type text not null, -- 'favorites' | 'collection' | 'log' | 'blog'
  description text,
  display_order int default 0,
  is_pinned boolean default false,
  created_at timestamptz default now()
)

items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  collection_id uuid references collections(id) on delete set null, -- nullable, items can exist without a collection
  type text not null, -- 'book' | 'movie' | 'music' | 'photo' | 'item' | 'link' | 'note' | 'place'
  title text,
  image_url text,
  external_id text,
  status text, -- 'reading' | 'read' | 'want to read' | 'favorite' | 'watching' | 'watched' | 'want to watch' | 'on repeat' | 'loved' | 'discovered' | 'own' | 'want'
  metadata jsonb, -- books: { author, genre, isbn, page_count } | movies: { director, genre, tmdb_id, media_type } | music: { artist, album, spotify_id, media_type } | photos: { date_taken, location } | items: { brand, price, buy_url } | links: { url, description, source_type }
  user_note text,
  date_completed timestamptz,
  display_order int default 0,
  created_at timestamptz default now()
)

collection_items (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid references collections(id) on delete cascade,
  item_id uuid references items(id) on delete cascade,
  display_order int default 0,
  created_at timestamptz default now()
)

profile_widgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  item_id uuid references items(id) on delete cascade,       -- set if widget shows a single item
  collection_id uuid references collections(id) on delete cascade, -- set if widget shows a collection
  widget_title text,      -- optional personal label, e.g. "the book that changed me"
  widget_size text default '1x1', -- '1x1' | '1x2' | '2x1'
  position_x int default 0,
  position_y int default 0,
  display_order int default 0,
  created_at timestamptz default now()
  -- constraint: exactly one of item_id or collection_id must be non-null
)

follows (
  follower_id uuid references users(id) on delete cascade,
  following_id uuid references users(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (follower_id, following_id)
)
```

---

## What We're Building Right Now

**Phase 0 — Setup ✅**
- Next.js 16 + Tailwind initialized
- Note: Next.js 16 breaking changes — `cookies()` is async, `middleware.ts` is now `proxy.ts` with `export function proxy()`
- Supabase project created, schema applied
- RLS policies in place
- GitHub monorepo: `/web` active, `/mobile` not started

**Phase 1 — Core Profile (in progress)**
- ✅ Auth — sign up, log in, email confirmation, username setup
- ✅ Collections — create, edit, delete
- ✅ Items — add books via Google Books API search, delete items
- ✅ Profile page — bento grid with book cover previews, owner edit mode
- ⬜ Schema migration — apply new schema changes (see migration notes below)
- ⬜ Card templates — implement locked designs per content type and size
- ⬜ Widget system — profile_widgets, size picker, drag to place
- ⬜ More content types — movies (TMDB), music (Spotify)
- ⬜ Photo upload

**Phase 2 — Public Profiles**
- yourapp.com/[username] — server rendered, shareable
- Profile page works publicly already — collection/item detail pages not yet built

Do not build beyond Phase 2 until told to.

---

## Key Implementation Notes

- `username` is nullable on initial signup. Supabase trigger auto-creates user row. Onboarding fills username via upsert.
- Collections support mixed content types.
- Only Google Books wired up. TMDB and Spotify keys not in .env yet.
- `proxy.ts` handles Supabase session refresh on every request.
- `GOOGLE_BOOKS_API_KEY` in `.env.local`.
- `books.google.com` added to `next.config.ts` image remotePatterns.
- `collection_id` on items is nullable — items can exist independently.
- `collection_items` junction table handles many-to-many between collections and items.
- Profile widgets reference either `item_id` OR `collection_id`, never both. One must be null.
- Widget size lives on `profile_widgets`, not on `collections`. Collections have no size.
- `status` is a top-level column on `items`, not inside `metadata`.

### Schema Migration Needed (run in Supabase SQL editor)
The live schema differs from the new design. Before building further, run:
```sql
-- Add new columns to users
alter table users add column if not exists header_image_url text;
alter table users add column if not exists location text;
alter table users add column if not exists color_palette text default 'default';
alter table users add column if not exists font_pairing text default 'default';

-- Remove widget_size from collections (size now lives on profile_widgets)
alter table collections drop column if exists widget_size;

-- Make items.collection_id nullable and add new columns
alter table items alter column collection_id drop not null;
alter table items add column if not exists status text;
alter table items add column if not exists date_completed timestamptz;
alter table items drop column if exists user_rating;

-- Create collection_items junction table
create table if not exists collection_items (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid references collections(id) on delete cascade,
  item_id uuid references items(id) on delete cascade,
  display_order int default 0,
  created_at timestamptz default now()
);

-- Update profile_widgets
alter table profile_widgets add column if not exists item_id uuid references items(id) on delete cascade;
alter table profile_widgets add column if not exists widget_title text;
alter table profile_widgets alter column widget_size set default '1x1';
-- Update existing size values to new format
update profile_widgets set widget_size = '1x1' where widget_size = 'small';
update profile_widgets set widget_size = '1x2' where widget_size = 'medium';
update profile_widgets set widget_size = '2x1' where widget_size = 'large';
update profile_widgets set widget_size = '2x1' where widget_size = 'wide';
```

---

## Skills
- `/research <topic>` — researches how other apps handle a feature and recommends how we should apply it here. Runs as a forked subagent.
- `/reflect` — reviews what was just built, updates lab notes with lessons learned.

---

## Lab Notes

- **Next.js Image rounding**: Never use `overflow-hidden` on a wrapper to clip an `<Image>` — it only works if the wrapper has explicit dimensions and the image actually overflows. For `fill` + `object-contain`, `borderRadius` on the element rounds the box not the pixels. The only reliable pattern: use `width={0} height={0} sizes="..."` with `style={{ width: 'auto', height: Npx, borderRadius: X }}` directly on the image, or `clipPath: 'inset(0 round Xpx)'` on the wrapper. Ditch `fill` for any image that needs rounded corners.
- **Google Books image cleanup**: Strip `&edge=curl` and change `zoom=1` → `zoom=3` on thumbnails at the API route level (`app/api/search/route.ts`). Books already saved to the DB keep the old URL — only new adds get the clean version.
- **Library is source of truth**: Items are added in Library only. Collections organize existing library items via `collection_items` junction — no search inside collections. Profile widgets then reference items or collections from the library. Never blur these three layers.
- **Proportional animations**: Never use fixed px values for hover translations shared across different-sized elements. Use percentage-based translate (e.g. `translate-x-[22%]`) so the effect is proportionally identical regardless of element size.
- **Partial state refactor = broken file**: When renaming state variables, update all references in one rewrite pass — not incrementally. Partial renames leave the file broken and waste multiple tool calls diagnosing it.
- **File uploads in server actions require FormData**: Never pass a `File` object directly to a server action — it serializes to `{}`. Always build a `FormData` on the client and call `formData.get('file') as File` on the server side.
- **Don't double-round images inside overflow-hidden cards**: If the card wrapper already has `overflow-hidden` + `rounded-*`, adding `rounded-*` to the image inside creates visible gaps at the edges at rest. Only add rounding to the image when you *want* those corners visible (e.g. the photo slide-down effect where top corners appear on hover).
- **Animating background separately from icon**: When a hover effect should scale a background circle without affecting the icon inside, use a `position: absolute` span for the background and a `position: relative` span for the icon — never put the scale on the shared container.
- **Tiptap SSR**: Always set `immediatelyRender: false` in `useEditor()` in Next.js — without it Tiptap throws a hydration mismatch error on every render.
- **Tiptap editor styling**: Style the `.ProseMirror` output via a `<style>` tag injected in the component — Tailwind classes can't target Tiptap's generated HTML tags (h1, ul, li, strong) directly.
- **Build error triage**: When `npm run build` fails on type errors, run `tsc --noEmit` first to see ALL errors at once, identify which are pre-existing vs new, batch-fix same-pattern errors in one pass, then do a single build. Never chase errors one-at-a-time with repeated builds.
- **`metadata` unknown in JSX conditions**: `Record<string, unknown>` fields can't be used directly in `{x && <JSX>}` — TypeScript rejects `unknown` as ReactNode. Fix: `{(item.metadata?.field as string | null) && ...}`. Apply to all metadata accesses at once, not one at a time.
- **Next.js 16 config**: `serverActionsBodySizeLimit` moved to `experimental.serverActions.bodySizeLimit`. `@imgly/background-removal` requires `onnxruntime-web@1.21.0` installed explicitly as a peer dep.
