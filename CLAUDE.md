# ETB to Challenger

A private stats site for seven friends (all tagged `#ETB`) climbing **Ranked
Flex** together, from wherever they are to Challenger. It reads Riot match
data synced into Turso and turns it into a dashboard, player pages, team
analytics, season records and end-of-season awards.

**Read every markdown file in this repo before coding** (this file, `README.md`,
`docs/*.md`, `app/api/debug/README.md`). **When you finish, update them** — or
add a new doc — so they describe the code as it now is.

The priority order is: **correct numbers → clarity → consistency with the
design system → performance → polish.** When two conflict, the earlier wins.

---

## 1. Stack

| Concern    | Choice                                                         |
| ---------- | -------------------------------------------------------------- |
| Framework  | Next.js 16 (App Router, Turbopack), React 19                   |
| Language   | TypeScript, `strict`                                           |
| Styling    | Tailwind CSS v4 (`@tailwindcss/postcss`), tokens in `globals.css` |
| Icons      | lucide-react                                                   |
| Data       | Turso (libSQL) via `@libsql/client`; Riot API only during sync |
| Assets     | Riot DDragon (champion/profile/item icons, splash art)        |
| Testing    | Vitest                                                         |

No component library: the primitives in `app/components/ui/` are ours. Do not
add dependencies without a concrete need.

---

## 2. Architecture

```
Riot API ──▶ lib/sync.ts ──▶ Turso ──▶ lib/db.ts (unstable_cache, tag "db")
                                            │
             lib/roster.ts, lib/awards.ts, lib/rukawaAnalytics.ts, … (pure-ish)
                                            │
                              Server Components (pages) ──▶ client islands
```

- **Pages never call Riot.** `SyncTrigger` posts `/api/sync` when data is older
  than 15 min; the sync writes Turso and revalidates the `db` tag.
- **Reads happen in Server Components.** Never fetch initial data from a client
  `useEffect`. The one deliberate client fetch is match-history paging and
  filtering (`/api/matches`) — the first page still arrives server-rendered.
- **Cache every expensive read** with `unstable_cache(..., { tags: [DB_TAG],
  revalidate: 900 })` — `getAwardsData` and `getRukawaAnalytics` scan every
  season match. Payloads over ~2 MB can't be cached; `getMatchesByPuuid` uses
  React `cache()` per request instead.
- **The shell awaits nothing.** `AppShell` renders immediately; the sidebar's
  roster and sync time stream in behind their own `<Suspense>`. Every route has
  a `loading.tsx` (`PageSkeleton`) so a click paints at once.
- **Fetch in parallel** (`Promise.all`), never in sequence.
- **Don't ship raw matches to the client.** A Riot match is ~10 KB. Reduce on
  the server first: `summarizeLastGame` (dashboard), `toGroupMatchRows`
  (stacked games), `buildMatchView` (match page).
- **Server → client props must be plain data.** Never pass a component (e.g. a
  Lucide icon) into a `"use client"` component from a server one — pass a key
  and let the client pick the icon (`AwardBoard kind="players"`).
- **Turso load.** Several queries pull every season match's JSON. Run many at
  once and Turso answers `Resource exhausted: mem_hrana_response`. That's why
  DB-backed routes are `force-dynamic` so the build never queries Turso (on
  Vercel a cold build hit the limit), and the dashboard runs
  its heavy reads one at a time. When a query only needs a few fields, let
  Turso extract them (`json_extract(m.data, '$.info.gameDuration')`) instead
  of returning whole match JSON — see `getLoneWolfStats`. Don't add another
  "read every match" query without caching it, and read full match JSON only
  through `executePaged` (`lib/db.ts`) — one unbounded response is what fails.

### Folders

```
app/
  (routes)            page.tsx, team/, records/, awards/, player/[gameName]/, match/[matchId]/
  api/                sync, matches, debug/*, … (see app/api/debug/README.md)
  components/
    layout/           AppShell, NavPanel, MobileNav, RosterNav, PageHeader, PageSkeleton
    ui/               shared primitives (see §4) — the design system lives here
    dashboard/ player/ match/ team/ team/rukawa/ records/ awards/   feature components
  data/               constants.ts (LP math, tier colours, season), users.ts (roster)
  lib/                db, sync, roster, cir, cirUtils, format, matchView, lastGame,
                      awards, rukawaAnalytics, bestRoster, playstyle, groupMatches, …
  types/              riot.ts, user.ts
  fonts.ts            next/font declarations
  globals.css         tokens, base rules, motion
```

---

## 3. Code rules

### Don't repeat yourself

- **One source per fact.** CIR tier thresholds/labels/colours: `lib/cirUtils.ts`.
  Per-game CIR: `computeParticipantCir` in `lib/cir.ts` — never rebuild a
  `CIRInput` by hand in a component (it used to be copied five times). Role
  label/icon/colour: `ROLE_META` in `ui/RoleIcon.tsx`. Tier colours:
  `TIER_COLORS`. Number formatting: `lib/format.ts` (`formatNumber`,
  `formatCompact`, `formatSigned`, `formatDuration`, `formatTier`, `matchResult`).
- If you're copying JSX, extract a component. If you're copying logic, extract a
  function into `lib/` or a feature-local `*.ts`.
- Prefer a `variant` prop over a second component (`Panel`, `StatTile`,
  `SegmentedControl`, `RankNumber`, `Badge`, `MoreButton`).

### Separation

- **Files stay focused — ideally under 200 lines.** Split by responsibility:
  page (data + composition) → feature components (JSX) → hooks (`use*`,
  stateful logic) → `lib/` (pure functions) → `data/` (constants).
- Pure derivations live in `lib/` or a co-located `*.ts` (`leaderboardRows.ts`,
  `RecordData.ts`, `awardCategories.ts`, `rankingUtils.ts`). Components render.
- Server Components by default. `"use client"` only for interactivity (tabs
  held in state, filters, expanders, the mobile drawer).
- No `any`. No ignored TypeScript errors.

### State

- **Page-level tabs live in the URL** via `LinkTabs` (`/team?view=rukawa`,
  `/records?tab=cir`, `/awards?tab=winners`) — linkable, survive reloads, no JS.
- In-panel filters (role, stack, best/worst) are client state via
  `SegmentedControl`.

---

## 4. Design system

**Dark, desktop-first, "Hextech ledger":** deep blue-black surfaces, one gold
accent for the goal (Challenger), hextech teal for "one of us", tier colours
from the game. Calm surfaces; the numbers are the loud thing.

### Tokens (`app/globals.css`) — never raw palette colours

| Role          | Tokens / utilities                                                           |
| ------------- | ---------------------------------------------------------------------------- |
| Surfaces      | `bg-background`, `bg-card`, `bg-raised`, `bg-muted` (hover surface)          |
| Text          | `text-foreground`, `text-muted-foreground`, `text-faint`                     |
| Lines         | `border-border`, `border-border-strong`                                      |
| Brand         | `primary` (gold), `accent` (teal: roster players), `dossier` (Rukawa Files)  |
| Status        | `win`, `loss`, `remake` — a state, never a series                            |
| Match sides   | `side-blue`, `side-red`                                                      |
| Placements    | `medal-gold`, `medal-silver`, `medal-bronze` (via `RankNumber`)              |
| CIR tiers     | `cir-legendary … cir-poor` (via `getCirTier`, never by hand)                 |
| Categorical   | `pillar-*` (CIR pillars), `role-*` (roles via `ROLE_META`)                   |

- Tier colours are **data** (`TIER_COLORS`) and arrive as inline styles (or
  `ProfileIcon ringColor`). Nothing else uses inline colour.
- Win/loss colour means win/loss. Don't reuse `text-win` for "good number" in a
  new place without a reason — `PlayerStatsGrid` thresholds are the one
  sanctioned exception.
- Change a hue only in `:root`. Add a token before you add a one-off colour.

### Type

- `font-sans` **Geist** — everything by default.
- `font-display` **Chakra Petch** — page titles, panel titles (uppercase,
  tracked), hero numbers. Never paragraphs.
- `num` utility (tabular figures) on every number that sits in a column.

### Primitives (`app/components/ui/`) — reuse before you build

| Component          | Use for                                                               |
| ------------------ | --------------------------------------------------------------------- |
| `Panel`, `PanelHeader` | Every card-like surface and its titled header                     |
| `SectionHeader`    | A heading for content outside a Panel                                 |
| `PageHeader` (layout) | The heading every page opens with                                  |
| `StatTile`         | A labelled figure (KPI strips, hero stats)                            |
| `SegmentedControl` | In-page tabs/filters (`pill`/`underline`, `fullWidth`, `wrap`)        |
| `LinkTabs`         | URL-driven page tabs (same look as SegmentedControl)                  |
| `Badge`, `ResultBadge` | Small labels; win/loss/remake (+ `RESULT_STRIPE`, `RESULT_TEXT`) |
| `RankNumber`       | Leaderboard positions (medals; `variant="worst"` for halls of shame)  |
| `CirBadge`         | A CIR score with its tier                                             |
| `Meter`, `WinrateBar`, `TierProgressBar` | Bars                                           |
| `ProfileIcon`, `ChampionIcon`, `ItemsDisplay`, `RankBadge`, `RankEmblem`, `RoleIcon` | Game identity |
| `EmptyState`, `Skeleton`, `MoreButton`, `Spinner` | States                              |

A new look means a new or extended primitive here, not inline markup in a
feature. Long tab lists use `wrap` — never let a row of options clip.

### Layout

- **Desktop-first.** Design for ≥1280px; it must still work down to phones
  (sidebar becomes a top bar + drawer below `lg`).
- Content width `max-w-app` (80rem); sidebar `w-sidebar`.
- **No holes.** Every dashboard row is full-width or an equal-height pair
  (`items-stretch` + `Panel className="h-full"`). Don't put an odd number of
  cards in a two-column grid, or a short column beside a long one.
- **Components size themselves by their container, not the viewport**, when
  they can be placed in columns of different widths: `@container` on the
  panel, `@2xl:`/`@5xl:` on what's inside (see `Standings`). Content that
  can't fit is hidden, never wrapped mid-figure (`whitespace-nowrap`).
- Use the spacing scale (`max-h-112`, `min-w-224`), not arbitrary values.
  Arbitrary values are allowed only for grid templates.

### Radius hierarchy (child is always smaller than its parent)

`rounded-2xl` heroes · `rounded-xl` Panels/cards · `rounded-lg` nested blocks ·
`rounded-md` controls and champion icons · `rounded-sm` items · `rounded-full`
avatars and dots.

### Interaction

- **Anything clickable shows a pointer.** The rule lives once, in the base
  layer of `globals.css` (links, buttons, `role=button|tab`, …). If a clickable
  thing lacks the pointer, widen that selector; a custom clickable `div` needs a
  proper role (or add `cursor-pointer` explicitly).
- Hover surfaces use `hover:bg-muted` at full opacity — no `/40` overlays.
- Whole rows/cards are links when they lead somewhere (players → `playerHref`,
  games → `matchHref`).
- Expanders use a real `button` with `aria-expanded`.

### Motion

- One keyframe, applied by the container: `appear` (one element) and
  `appear-children` (staggered children, capped at the 8th). Re-key a list
  (`key={filter}`) to replay it on a filter change. `grow-x` for bar fills.
- Animate opacity/translate only. A blanket `prefers-reduced-motion` rule turns
  everything off.

### Copy

English UI, short and specific. Keep the group's jokes (Divas, Records'nt, the
Rukawa Files) — they're features.

---

## 5. Domain

- **Season**: Flex queue (`QUEUE_FLEX` 440) since `SEASON_START_EPOCH`.
  Remakes (< 5 min, `isRemake`) never count toward CIR or awards.
- **Ladder LP** (`rankToLp`) maps tier+division+LP to one number; Challenger is
  `CHALLENGER_LP`. "Wins needed" assumes `AVG_LP_PER_WIN`.
- **CIR v3** (`lib/cir.ts`): role-weighted impact over four pillars (combat,
  utility, economy, pressure). Tiers in `lib/cirUtils.ts`: Legendary ≥ 20,
  Dominant ≥ 15, Great ≥ 11, Solid ≥ 8, Average ≥ 6, Poor below.
- **Awards** (`lib/awards.ts`): score = avg CIR × 0.7 + win rate × 0.3, where
  both averages are first shrunk toward the roster's season average as if the
  nominee had `AWARD_PRIOR_GAMES` extra average games (10 for roles, 15 for
  picks) — so volume earns trust and 5-game samples can't sweep the top.
  Player awards need 15 games in the role; a player gets one nomination per
  qualifying role, so up to five MVP entries. A signature pick is one
  champion **in one role** (Diana mid and Diana jungle are separate), min. 5
  games. The prior values are in the cache key. Voting is locked until the
  season ends; Winners shows live frontrunners.
- **Splash art** (`lib/skinUtils.ts`): DDragon's skin list includes chromas
  (`parentSkin`) that have no splash, some real skins are missing, and match
  data spells some champions differently (`ddragonChampionId`). Pick from real
  skins only, check the image exists, fall back to skin 0.
- **Best roster** (`lib/bestRoster.ts`): exhaustive search for the highest
  total CIR lineup, one player per role, min. 3 games in role.

---

## 6. Working on this repo

- Before calling anything done: `npx tsc --noEmit`, `npm run lint`,
  `npm test`, `npm run build`. Known: three tests in `lib/cir.test.ts` expect
  older CIR weights/caps and fail on `main` too.
- **Check pages in a browser and read the console.** The dev server runs on
  :3000 (`.claude/launch.json`, `etb-dev`).
- **Turbopack's CSS watcher on this machine sometimes misses new Tailwind
  classes** (styles from an edit simply don't appear). Before debugging a
  layout, confirm the class exists in the served CSS; if not, restart the dev
  server (and delete `.next/dev`).
- Never commit or push unless asked.
