# Claude Code handoff — Filter drawer (Option B)

**Mission:** replace the current persistent filter strip in `/redesign` with
a 56px sticky bar whose only filter affordance is a single "Filter" pill that
opens a drawer. Mobile-friendly throughout — drawer slides up as a bottom
sheet under 640px wide, slides in from the right above.

The reference implementation is already in the package at
`src/components/redesign/FilterBar.tsx`. This doc is your installation guide
and acceptance checklist.

---

## What the new bar looks like

**Default state (no filters applied):**

```
┌──────────────────────────────────────────────────────────────────────┐
│ 🟩 2025 FI Survey   Who responded  Compare  …      [ ⚙ Filter ]  n=… │
└──────────────────────────────────────────────────────────────────────┘
```

**With 3 filters active:**

```
┌──────────────────────────────────────────────────────────────────────┐
│ 🟩 …Survey   Who responded  …    Geo:US ×   Flavor:2 ×   [⚙ Filter ③] │
└──────────────────────────────────────────────────────────────────────┘
```

**Drawer open (desktop right-side):**

```
                          ┌────────────────────────┐
                          │ Filter the sample  n=… │
                          ├────────────────────────┤
                          │ GEOGRAPHY              │
                          │ [All] [US] [Canada]…   │
                          │                        │
                          │ FI STATUS              │
                          │ [All] [Pursuing] …     │
                          │ …                      │
                          │ FLAVOR · multi-select  │
                          │ [FI] [ChubbyFI] …      │
                          ├────────────────────────┤
                          │ Reset    [Apply · 412] │
                          └────────────────────────┘
```

**Drawer on mobile (bottom sheet, 88vh):** same content, slides up from the
bottom, rounded top corners.

---

## Install

### Step 1 — Add the Sheet primitive

The drawer uses shadcn's `Sheet` (Radix-based). You don't have it yet:

```bash
npx shadcn@latest add sheet
```

This writes `src/components/ui/sheet.tsx`. Don't touch it after — it's
shadcn's standard implementation.

### Step 2 — Drop in the new FilterBar

The package contains the reference component at:
```
src/components/redesign/FilterBar.tsx
```

This file **replaces** the current `src/components/redesign/FilterBar.tsx`
(which is the v1 pill-strip version). The page (`src/app/redesign/page.tsx`)
already imports `FilterBar` from this path — no other changes needed.

### Step 3 — Verify imports

The new component imports:
- `Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger` from `@/components/ui/sheet` — provided by Step 1.
- All other imports (`useRouter`, `paramsToFilters`, `AGE_BRACKETS`, `FI_FLAVORS`, `cn`) are already in the repo.

Run `pnpm typecheck && pnpm build`. If either fails, the most likely cause is
the Sheet component not installed — re-run Step 1.

---

## Behaviour spec

### Header layout

| Width | Brand | Section nav | Active chips | Filter pill | Sample count |
|---|---|---|---|---|---|
| **< 480px (xs)** | icon only | hidden | hidden | icon-only | hidden |
| **480–639px (sm)** | icon + name | hidden | up to 2, then "+N more" | icon + "Filter" + count | hidden |
| **640–767px (md)** | icon + name | hidden | up to 2, then "+N more" | icon + "Filter" + count | hidden |
| **768–1023px (lg)** | icon + name | visible (5 links) | up to 2, then "+N more" | icon + "Filter" + count | hidden |
| **≥ 1024px (xl)** | icon + name | visible (5 links) | up to 2, then "+N more" | icon + "Filter" + count | "n = X / Y" |

The component uses Tailwind responsive prefixes (`xs:`, `sm:`, `md:`, `lg:`)
to hit these breakpoints. If your Tailwind config doesn't define an `xs`
breakpoint, add one at `480px`, or replace `xs:` with `sm:` throughout (the
brand collapses one breakpoint earlier).

### Filter pill states

- **Idle (no filters):** white background, 1px slate-050 border, dark text.
- **Active (≥1 filter):** dark navy background, white text, cyan count
  badge with the active filter count.

The pill is always reachable. It uses `<SheetTrigger asChild>` to be wrapped
by the Sheet primitive.

### Drawer side

- **< 640px viewport:** slides up from the bottom, 88vh tall, rounded top
  corners. This is a bottom-sheet pattern.
- **≥ 640px viewport:** slides in from the right, 420px wide, full height.

Switched at runtime via `useIsMobile()` (uses `window.matchMedia`). The Sheet
component remounts when `side` changes, which is fine here — drawer state
re-derives from `useSearchParams`.

### Filter application

Filters apply **live** as the user clicks pills inside the drawer (same as
the current implementation). The drawer footer button is a "Done" /
"Apply · N results" affordance that just closes the drawer — there's no
draft state to commit. The count in "Apply · 412 results" is the live
filtered count, so the user sees the impact of their changes immediately.

### Active filter chips

Shown inline in the bar to the LEFT of the filter pill. Format:

- Single-select filter (Geo, Status, Household): `Geo: US ×`
- Multi-select (Flavor, Age): `Flavor: 2 ×` (just shows count, not values)

Max 2 chips shown inline. If more, show `+N more` text. (No clear-individual
button on the inline chips in this implementation — that lives in the
drawer. Adding × buttons inline is a follow-up if you want.)

### About this sample (bias note)

The drawer has a small "About this sample" footer block above the
Reset/Apply row. It absorbs the existing inline bias call-out from
`CompareSection.tsx` — when you're done with this task, **remove the
duplicate bias call-out from CompareSection** (the amber box at the top of
the compare section). The drawer is now its canonical home.

---

## Acceptance criteria

A1. Header is 56px tall on every viewport. No taller.
A2. At ≥1024px: brand + 5 nav links + active chips + filter pill + `n = X / Y`. Single line.
A3. At 640–1023px: brand + active chips + filter pill. Nav hidden.
A4. At <640px: brand (icon + name if room) + filter pill. All other chrome hidden.
A5. Clicking "Filter" opens the Sheet. On desktop slides from the right; on mobile slides up from the bottom.
A6. Clicking any pill inside the drawer updates the URL and the report immediately. No "Apply" step required.
A7. The pill in the bar shows a cyan count badge when ≥1 filter is active. Background flips to dark navy.
A8. Inline chips display up to 2 active filters with "+N more" if more.
A9. Drawer body scrolls if content exceeds height (test by selecting many flavors + ages).
A10. The drawer's "Reset all" button is disabled when no filters are active. Becomes active and clears the URL when clicked.
A11. The drawer's footer button reads "Done" with no filters, "Apply · N results" with filters active. Clicking it closes the drawer (does not re-set anything).
A12. Pressing Esc or clicking the scrim closes the drawer.
A13. Focus is trapped inside the drawer while open; returns to the trigger on close (Radix handles this).
A14. After this lands, the bias call-out at the top of `CompareSection.tsx` is removed (the drawer's "About this sample" block replaces it).

---

## Files touched

| File | Change |
|---|---|
| `src/components/ui/sheet.tsx` | **New** (added by `npx shadcn add sheet`) |
| `src/components/redesign/FilterBar.tsx` | **Replaced** with the new drawer implementation |
| `src/components/redesign/CompareSection.tsx` | Edit — remove the amber `<div>` bias call-out near the top of the section |

Nothing else needs to change. `page.tsx` imports `FilterBar` from the same
path; the function signature is unchanged.

---

## One-shot prompt

Paste this into Claude Code with the repo open:

> Read `redesign-package/CLAUDE-CODE-FILTER-DRAWER.md` and follow it end to
> end. Install the shadcn Sheet primitive, replace
> `src/components/redesign/FilterBar.tsx` with the version from the package,
> and remove the duplicate bias call-out from `CompareSection.tsx` per
> Acceptance Criterion A14. Verify every criterion A1–A14 by resizing the
> browser and exercising the filters. Take screenshots at 1440px, 768px,
> and 375px width.

---

## Notes / known issues to handle

- **Tailwind `xs` breakpoint.** If your Tailwind config has no `xs`, either add `'xs': '480px'` to `theme.screens`, or replace every `xs:` in the file with `sm:`. The visual fallback is acceptable.
- **Backdrop blur on Safari.** Already using `-webkit-backdrop-filter`, but if you see jankiness on iOS Safari < 16 (rare), reduce blur from 14px to 8px.
- **Server vs client mismatch.** `useIsMobile` reads `window` and will be `false` on first render server-side. The component is `"use client"`, so SSR will render the desktop variant briefly before hydration. This causes a flash on real mobile devices loading the page. If you want to avoid that flash, render BOTH the bottom and right variants with `hidden md:block` / `block md:hidden` wrappers instead of switching with state — that gets resolved at CSS time, no JS needed. Refactor optional but recommended for production.
- **Live count in "Apply" button.** The `count` prop already reflects the filtered count, so `Apply · 412 results` updates as the user toggles. If you want the count to reflect what the count *would be* after applying (when you switch to a commit-on-apply pattern), you'd need to recompute on every toggle inside the drawer state — out of scope for this pass.
