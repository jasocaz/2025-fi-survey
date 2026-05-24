# Claude Code handoff — make `/redesign` look like the mock

**Mission:** the deployed `/redesign` route should visually match
`_mock-reference/Report Redesign.html`. The data wiring, color scope, and
component scaffold are already in place. Your job is to close the remaining
visual gap.

---

## What's already done (you don't need to redo any of this)

- New route at `src/app/redesign/` with its own scoped CSS (`styles.css`) and layout (`layout.tsx` wraps children in `<div data-theme="redesign">`).
- New component tree at `src/components/redesign/**` and color constants at `src/lib/redesign/theme.ts`.
- Original `/` route is untouched and stays untouched.
- v1.1 patch: font pinned to Geist inside the scope, `MethodologySnapshotSection` added, sections renumbered 01–09.

## The reference

Open `_mock-reference/Report Redesign.html` in a browser. This is the
**ground truth visual**. Two halves:

1. **Top half (the audit doc)** — written design critique + principles. Skip; you don't need to recreate this.
2. **Bottom half (the redesigned report)** — starts at the gradient mesh hero. **This is what `/redesign` should look like.**

Other helpful files in `_mock-reference/`:

- `colors_and_type.css` — the design system tokens the mock uses. Cross-reference against `src/app/redesign/styles.css` to spot any token I left untranslated.
- `report.css` — page-specific styles. Useful for layout details (KPI dividers, card padding, eyebrow pill construction, hero stat row).
- `report-body.js` — generates the chart SVGs in the mock. The histogram + age-band + stacked-bar functions are useful references for the look you're targeting.

---

## How to run

```bash
pnpm dev                       # http://localhost:3000/redesign
pnpm build                     # confirm no TS errors
```

Use the mock + the deployed `/redesign` in two side-by-side browser tabs.
Iterate.

---

## Acceptance criteria (in priority order)

A1. Hero gradient mesh renders; H1 + lede in sans-serif Medium (not Times serif).
A2. Every section title (`<SectionHeader />`) reads in sans-serif Medium 500, color `var(--navy)` (`#0A2540`).
A3. The "/01" meta number is monospace, left-aligned in its own ~200px column; the title sits in the right column, left-aligned. Two-column spine.
A4. All charts use only emerald + slate. No warm stone, no warm beige gridlines.
A5. Module cards: 1px `var(--slate-050)` border, 12px radius, white background, 24–28px padding.
A6. Histograms in the mock have a **median callout pill** sitting above the median bin (small filled chip reading "MEDIAN $1.58M"). Replicate this in Recharts.
A7. Big numbers in the cohort/Plan cards (`AlreadyFISection`'s "26%", `FIPlanSection`'s "3.5%" if you add it) render at `clamp(56px, 7vw, 96px)`, `font-weight: 300`, tracked `-0.035em`. Tabular figures.
A8. Footer is full-bleed navy gradient with white headline and muted link row.

---

## Concrete tasks

### Task 1 — Verify the foundation landed

Run `pnpm dev`, open `/redesign`. Confirm:

- Hero is a green gradient with yellow + cyan flares (not flat green).
- All text is **sans-serif** Geist. If it's Times serif anywhere, the `font-family` line in `src/app/redesign/styles.css` isn't taking — check that `--font-geist-sans` is set on `<html>` in `src/app/layout.tsx` (it should be, via `geistSans.variable`).
- The `/01 · METHODOLOGY` meta + "A self-reported snapshot…" intro section renders between the hero and the demographics breakdown.

If any of those are broken, fix first before touching anything else.

### Task 2 — Histogram median callout pills

The mock's net worth histogram has a small purple pill above the median bin reading "MEDIAN $1.58M". Recharts has no built-in for this; build it via `<ReferenceLine />` with a custom label component.

Example pattern (apply to `NetWorthSection.tsx`, `FIPlanSection.tsx`'s SWR histogram, `IncomeExpensesSection.tsx`'s savings rate, and `AlreadyFISection.tsx`'s actual SWR):

```tsx
<ReferenceLine
  x={medianBinLabel}
  stroke={BRAND.green}
  strokeWidth={1.5}
  strokeDasharray="3 3"
  ifOverflow="extendDomain"
  label={({ viewBox }) => {
    const { x = 0, y = 0 } = viewBox || {};
    return (
      <g transform={`translate(${x}, ${y - 12})`}>
        <rect x={-36} y={-16} width={72} height={18} rx={9} fill={BRAND.green} />
        <text x={0} y={-3} textAnchor="middle" fontSize={10} fontWeight={500} fill="white" letterSpacing="0.04em">
          MEDIAN {formattedValue}
        </text>
      </g>
    );
  }}
/>
```

Reference: `_mock-reference/report-body.js`, `histogram()` function, `markers` section.

### Task 3 — Chart axis polish

In `src/lib/redesign/theme.ts`, the `CHART` constants drive every Recharts chart. Bump:

```ts
export const CHART = {
  axisLabel: SLATE[400],       // was SLATE[300] — too light; bump for legibility
  axisTitle: SLATE[600],       // was SLATE[400]
  gridline: SLATE["050"],      // keep
  gridlineDashed: "2 4",       // was "3 4" — match mock's tighter dash
  ...
}
```

Then on every `<CartesianGrid>` in `src/components/redesign/**`:

- Ensure `strokeDasharray={CHART.gridlineDashed}`.
- Drop `vertical={false}` only on vertical-axis-driven charts (bar/line); keep `horizontal={false}` for horizontal stacked bars.
- Set `<XAxis tick={{ fontSize: 12 }} />` (was 11) — bump for readability.

### Task 4 — Tighten chart x-axis domains

The "Industry (top 9)" bar chart in `WhoRespondedSection.tsx` currently auto-scales its x-axis to ~600 even though the largest bar is ~450. Fix:

```tsx
<XAxis type="number" domain={[0, 'dataMax']} ... />
```

Apply this to every horizontal bar chart where the axis runs past the data.

### Task 5 — Section titles, copy parity

The mock uses sharper section titles than the current generic ones. Replace these strings in the corresponding section components:

| File | Current title | Mock title |
|---|---|---|
| `NetWorthSection.tsx` | "Net worth, assets, and debt." | "Half the community sits above $1.58M in net worth." (compute the median once and interpolate) |
| `FIPlanSection.tsx` | "The plan." | "$2.5M is the number the community is walking toward." |
| `IncomeExpensesSection.tsx` | "Income and expenses." | "Year after year, this community saves a lot of its income." (or interpolate the median savings rate) |
| `AlreadyFISection.tsx` | "The already-FI cohort." | "One in four respondents say they've already arrived." (or `${pctFI}% of the community has`) |

Pull live data values into the titles where possible — e.g. compute median NW in the component and template it into the headline. Falls-back gracefully when filters change the median.

### Task 6 — Big numbers (cohort cards)

`AlreadyFISection.tsx` has a navy gradient card with "26%". Verify it renders at `clamp(56px, 7vw, 96px)`, `font-weight: 300`, `letter-spacing: -0.035em`, tabular figures. If `font-light` (300) isn't loading from Geist, swap to `font-weight: 200` (Thin) — they look similar at this scale.

Replicate this card pattern in `FIPlanSection.tsx` for the median SWR (3.5% headline), and in `CompareSection.tsx` for the visitor's percentile result.

### Task 7 — Section spine consistency

The mock's `SectionHeader` is rock-solid: 200px meta column, gap-16, items-end. Confirm every section uses `<SectionHeader />` and **none** has a hand-rolled eyebrow + h2 + paragraph header. (Check `CompareSection.tsx` and `MacroMoodSection.tsx` in particular — they were the most complex to convert and may have ended up with one-off chrome.)

### Task 8 — Footer

The page already ends in a full-bleed navy gradient footer with white headline + muted links. Confirm:

- `background: var(--gradient-navy)` resolves to the linear-gradient (#0A2540 → #011936).
- Headline is `text-[clamp(28px,3vw,40px)] font-medium` — matches mock's `.report-footer h3` rule.
- The bottom link row has a 1px white/12% border above it.

### Task 9 — Optional: Notable findings section

The mock includes a "Notable findings" section (section 10) — five `<div class="card">` boxes, each with a colored chip + pull quote + supporting text. **Not currently in the repo.**

If you want to add it: create `src/components/redesign/NotableFindingsSection.tsx`, give it `number="08.5"` or renumber from MacroMood (07) → it (08) → AlreadyFI (09) → Methodology (10). Content lives in the mock at section 10 — five qualitative findings sourced from the survey. Keep it static unless you want to derive quotes from the data programmatically.

### Task 10 — Optional: "Years to FI" histogram

The mock has a dedicated "Years to FI" histogram (section 08). The current repo's `pct_to_fi` field doesn't directly map to "years remaining," but you can derive it: assume 7% real return + current savings rate, compute years for each respondent who isn't already FI, histogram the result. If `useVisitorProfile` already does this calc, reuse it.

This is **optional** — the existing "% of FI achieved by age" chart in `NetWorthSection.tsx` covers similar ground.

---

## What NOT to do

- **Don't modify `src/app/layout.tsx`, `src/app/globals.css`, `src/app/page.tsx`, or anything under `src/components/sections/**` or `src/components/charts/**`** — those power the original `/` route and must stay byte-identical.
- **Don't replace Recharts with a custom SVG engine** to match the mock pixel-for-pixel. Recharts is already wired; styling it correctly is enough. The mock used static SVG because there was no data; you have data.
- **Don't reintroduce the warm stone palette anywhere inside `/redesign`.** All colors come from `--brand-*` and `--slate-*` tokens defined in `styles.css`, or constants in `src/lib/redesign/theme.ts`.

---

## Verification before declaring done

1. `pnpm build` exits clean.
2. `pnpm typecheck` (if you have it) exits clean.
3. Visit `/redesign` — every checklist item in **Acceptance criteria** above is met.
4. Visit `/` — confirm it looks **byte-identical** to before. If anything shifted, a token leaked out of the scope.
5. Mobile width (< 640px): the section spine collapses, KPI rows reflow, charts shrink. No horizontal scroll.
6. Filter bar interactions still work — change geography, status, age; the numbers in the hero + sections update accordingly (this proves `useSearchParams` + `applyFilters` still flow correctly).

---

## If something blocks you

The most likely blockers and where to look:

- **Charts look unstyled / wrong color** → check `src/lib/redesign/theme.ts` imports in the section file. Recharts color props need literal hex strings (`#0E9F6E`), not CSS variables.
- **Layout is right but text is serif** → the `font-family` line in `styles.css` isn't applying. Check `[data-theme="redesign"]` selector is on a parent of the content.
- **CSS variables show as raw `var(--brand)` strings in computed style** → Tailwind v4 isn't compiling the arbitrary value syntax. Try replacing `bg-[var(--brand)]` with `bg-emerald-600` (Tailwind built-in, closest match) or with `style={{ background: "var(--brand)" }}` (always works).

---

## One-shot prompt to start

Paste this into Claude Code with the repo open:

> Read `redesign-package/CLAUDE-CODE-HANDOFF.md`. Then open
> `redesign-package/_mock-reference/Report Redesign.html` in a browser and
> compare against `localhost:3000/redesign`. Work through Tasks 1–8 in order,
> committing after each task. Skip Tasks 9–10 unless I ask for them. After
> each commit, take a screenshot of the matching section on both pages and
> diff them; if they're not within ~5% visually, iterate before moving on.
