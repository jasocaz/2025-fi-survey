# Redesign — apply instructions

This package adds a **separate report at `/redesign`** to your existing
Next.js app. Your current `/` route is **not touched** — both reports coexist.

> **Iterating on the visuals?** See `CLAUDE-CODE-HANDOFF.md` — it's a
> step-by-step plan you can paste into Claude Code to close any remaining
> visual gap against the static mock in `_mock-reference/`.
>
> **Reworking the filter header?** See `CLAUDE-CODE-FILTER-DRAWER.md` — a
> focused handoff for swapping the current persistent filter strip for a
> single sticky 56px bar + responsive drawer (right-side on desktop,
> bottom-sheet on mobile). Reference implementation already in
> `src/components/redesign/FilterBar.tsx`.

## What you're getting

```
src/
├── app/
│   └── redesign/
│       ├── layout.tsx          ← scoped layout, imports the redesign CSS
│       ├── page.tsx            ← the new report
│       └── styles.css          ← design tokens scoped to <div data-theme="redesign">
├── components/
│   └── redesign/
│       ├── AlreadyFISection.tsx
│       ├── CompareSection.tsx
│       ├── FilterBar.tsx
│       ├── FIPlanSection.tsx
│       ├── HeroSection.tsx
│       ├── IncomeExpensesSection.tsx
│       ├── MacroMoodSection.tsx
│       ├── MethodologySection.tsx
│       ├── NetWorthSection.tsx
│       ├── SectionHeader.tsx
│       ├── WhoRespondedSection.tsx
│       └── charts/
│           ├── PercentileBar.tsx
│           └── WhiskerChart.tsx
└── lib/
    └── redesign/
        └── theme.ts            ← chart colors + brand tokens (runtime constants)
```

Every file is **new**. Nothing in your existing repo is modified.

## How the isolation works

- All design tokens live inside `[data-theme="redesign"]` in `styles.css`.
- `app/redesign/layout.tsx` wraps the route's tree in `<div data-theme="redesign">`.
- Tailwind utilities (`bg-primary`, `text-foreground`, `border-border`, etc.) compile to `var(--*)` references. Inside the wrapper, those variables are overridden to the new emerald + slate values; outside, your originals still win.
- The redesign uses your existing data (`@/app/data/responses.json`, `precomputed.json`), shared hooks (`useVisitorProfile`), shared lib (`formatDollar`, `applyFilters`, etc.), and shadcn primitives (`Input`, `Slider`, `Tooltip`). Computation paths are identical to your original page; only the JSX/styling differs.

## Apply

### Option A — drop in by hand

1. Copy the `src/` tree from this package into your repo (it merges cleanly — every new path lives under `redesign/` subfolders).
2. Run your dev server: `pnpm dev`.
3. Visit `http://localhost:3000/redesign`.

### Option B — hand to Claude Code

Open Claude Code in your repo and paste:

> Apply the redesign package from `./redesign-package`. Copy `src/app/redesign/*`, `src/components/redesign/**`, and `src/lib/redesign/*` into the corresponding locations under `src/`. Do not modify any existing file. Then run `pnpm typecheck` and `pnpm build`, and report any errors.

### Option C — git apply

The whole package is additive, so a clean copy is sufficient. No patches needed.

## What changes between `/` and `/redesign`

| Aspect | `/` (original) | `/redesign` (new) |
|---|---|---|
| Body bg | `#fbfaf7` warm stone | `#ffffff` (with `slate-025` alt bands) |
| Body text | warm stone-900 | navy `#0A2540` |
| Headline font | `font-serif` | sans (Geist, medium weight) |
| Accent | green `#0a7d4a` | emerald `#0E9F6E`, unified across all sections |
| Hero | white background with bordered KPI cards | full-bleed gradient mesh; KPIs with vertical dividers |
| Section header | inline `§01 / h2 / muted lede` | dedicated `<SectionHeader />` with two-column meta + title spine |
| Sections | top border, no surrounds | banded modules; alternating `slate-025` background |
| Charts | warm gridlines `#f0ede6`, axis `#78716c` | cool `slate-050` gridlines, axis `slate-300`; centralized in `lib/redesign/theme.ts` |
| Layout density | 8 separate vertical blocks | grouped "modules" — related charts share a card |
| Chart tooltips | warm borders | cool slate borders, soft shadow, rounded |

## Things to verify after applying

- `pnpm dev` — open `/redesign`. Hero gradient renders; sticky filter bar at top with brand pill mark.
- Click around `/redesign` and confirm the existing filter behavior still works (query params propagate through `useSearchParams`).
- Navigate back to `/` — confirm it looks **identical** to before. If anything in your original styling shifted, your `globals.css` is leaking a token; tell me which and I'll re-scope it.
- Open DevTools, inspect any element inside `/redesign`, confirm computed `color: rgb(10, 37, 64)` and brand surfaces are emerald.

## Notes / tradeoffs

- I kept your existing Geist font instead of swapping to Helvetica Neue. Geist is geometric, modern, and ships through `next/font/google` — swapping it is a separate decision. If you want HelveticaNeue, the change is one line in `app/layout.tsx` and a font import.
- The `Hero` uses a custom `splitCompactDollar()` helper rather than `formatDollar()` so the suffix (`M`, `K`) can be styled in cyan against the gradient. If you want it to use your existing `formatDollar`, replace the helper.
- The bias call-out in `CompareSection` lost its amber styling — the redesign uses a neutral card on white so all sections feel like one document. If you want the amber alarm-tone back, swap `bg-white` → `bg-amber-50` and re-add the amber border.
- `WhoRespondedSection` lost the warning chip that flagged tiny filter cohorts (n < 30). That logic still lives in `FilterBar` (top-right `n = X / Y` turns amber). If you want it inline in the section too, port the `isSmallSample` ternary from the original.

## Patch notes

### v1.1
- **Font fix.** Your existing `globals.css` declares `--font-sans: var(--font-sans)` (a circular self-reference), so Tailwind's `font-sans` utility resolves to the browser default — Times serif on macOS. Added an explicit `font-family: var(--font-geist-sans), …` to the `[data-theme="redesign"]` scope so headlines and body render in Geist. Nothing outside `/redesign` is touched.
- **New section: `MethodologySnapshotSection`.** Sits between hero and demographics. Establishes "what this data is" before the percentile breakdown lands. Pulls from `precomputed.json` only (no new data dependencies).
- **Section renumbering.** Methodology snapshot is `/01`; demographics is `/02`; everything else shifts by 1.

## Removing the redesign

Delete:

```
src/app/redesign/
src/components/redesign/
src/lib/redesign/
```

That's it. Zero footprint elsewhere.
