"use client";
import { useCallback, useTransition, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { Filters } from "@/lib/types";
import { AGE_BRACKETS, FI_FLAVORS } from "@/lib/types";
import { filtersToParams, paramsToFilters } from "@/lib/filters";
import { cn } from "@/lib/utils";

interface Props {
  count: number;
  total: number;
}

const GEO_OPTIONS = [
  { value: "all", label: "All" },
  { value: "US", label: "US" },
  { value: "CA", label: "Canada" },
  { value: "EU", label: "Europe" },
  { value: "APAC_OTHER", label: "APAC+Other" },
] as const;

const FI_STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "pursuing", label: "Pursuing FI" },
  { value: "fi", label: "Already FI" },
  { value: "re", label: "Already RE" },
] as const;

const HOUSEHOLD_OPTIONS = [
  { value: "all", label: "Any" },
  { value: "single", label: "Single income" },
  { value: "dual", label: "Dual income" },
] as const;

/** Tracks viewport so we can switch the Sheet from right-side (desktop)
 *  to bottom-up (mobile) without remounting the component. */
function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [breakpoint]);
  return isMobile;
}

function countActiveFilters(f: Filters): number {
  let n = 0;
  if (f.geo !== "all") n++;
  if (f.fi_status !== "all") n++;
  if (f.household !== "all") n++;
  n += f.flavors.length;
  n += f.age_brackets.length;
  return n;
}

function pillClass(active: boolean) {
  return cn(
    "px-3 py-1.5 rounded-full text-[12px] font-medium border transition-colors font-[inherit]",
    active
      ? "bg-[var(--brand)] text-white border-[var(--brand)]"
      : "bg-white border-[var(--slate-050)] text-[var(--slate-600)] hover:border-[var(--brand)] hover:text-[var(--brand)]",
  );
}

export function FilterBar({ count, total }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const filters = paramsToFilters(searchParams);
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const isSmallSample = count < 30;
  const activeCount = countActiveFilters(filters);

  const updateFilters = useCallback(
    (updates: Partial<Filters>) => {
      const next = { ...filters, ...updates };
      const params = filtersToParams(next);
      startTransition(() => router.replace(`?${params.toString()}`, { scroll: false }));
    },
    [filters, router],
  );

  const reset = () => {
    startTransition(() => router.replace("?", { scroll: false }));
  };

  const toggleFlavor = (f: string) => {
    const next = filters.flavors.includes(f)
      ? filters.flavors.filter((x) => x !== f)
      : [...filters.flavors, f];
    updateFilters({ flavors: next });
  };

  const toggleAge = (a: string) => {
    const next = filters.age_brackets.includes(a)
      ? filters.age_brackets.filter((x) => x !== a)
      : [...filters.age_brackets, a];
    updateFilters({ age_brackets: next });
  };

  // Active filter chips — shown inline on sm+, hidden on xs.
  // Truncate to 2 max; rest collapse into +N more.
  const chips = buildChips(filters);

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderBottom: "1px solid var(--slate-050)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3 sm:gap-6">
        {/* Brand */}
        <a href="#top" className="flex items-center gap-2.5 font-medium text-sm tracking-[-0.01em] shrink-0">
          <span
            className="block w-[22px] h-[22px] rounded-md"
            style={{ background: "var(--gradient-brand-deep)" }}
            aria-hidden
          />
          <span className="hidden xs:inline">2025 FI Survey</span>
        </a>

        {/* Nav — only on md+ */}
        <nav className="hidden md:flex items-center gap-6 text-[13px] text-[var(--slate-600)]">
          <a href="#demographics" className="hover:text-foreground transition-colors">Who responded</a>
          <a href="#networth" className="hover:text-foreground transition-colors">Net worth</a>
          <a href="#fi-plan" className="hover:text-foreground transition-colors">The plan</a>
          <a href="#already-fi" className="hover:text-foreground transition-colors">Already FI</a>
          <a href="#notable-findings" className="hover:text-foreground transition-colors">Notable findings</a>
          <a href="#compare" className="hover:text-foreground transition-colors">Compare</a>
        </nav>

        <div className="flex-1" />

        {/* Active filter chips — hidden below sm; collapse via +N more */}
        <div className="hidden sm:flex items-center gap-1.5 max-w-[40%] overflow-hidden">
          {chips.slice(0, 2).map((c) => (
            <ActiveChip key={c.key} label={c.label} value={c.value} />
          ))}
          {chips.length > 2 && (
            <span className="text-[11px] font-medium text-[var(--slate-500)] shrink-0">
              +{chips.length - 2} more
            </span>
          )}
        </div>

        {/* Filter trigger — Base UI Dialog.Trigger renders as <button> by default */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            className={cn(
              "inline-flex items-center gap-2 rounded-full text-[12px] font-medium shrink-0 transition-colors",
              "px-3 py-1.5 sm:px-3.5 sm:py-2",
              activeCount > 0
                ? "bg-foreground text-white"
                : "bg-white text-foreground border border-[var(--slate-050)] hover:border-[var(--slate-200)]",
            )}
            aria-label="Open filters"
          >
            <FilterIcon />
            <span className="hidden xs:inline">Filter</span>
            {activeCount > 0 && (
              <span
                className="inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[11px] font-semibold px-1.5 tabular-nums"
                style={{ background: "#F5D5A4", color: "#04432D" }}
              >
                {activeCount}
              </span>
            )}
          </SheetTrigger>

          <SheetContent
            side={isMobile ? "bottom" : "right"}
            className={cn(
              "p-0 flex flex-col gap-0",
              isMobile
                ? "h-[85dvh] max-h-[85dvh] rounded-t-2xl"
                : "w-[420px] sm:max-w-[420px]",
            )}
            style={{
              fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
              paddingTop: isMobile ? "env(safe-area-inset-top)" : undefined,
            }}
          >
            <SheetHeader className="px-6 pt-5 pb-4 border-b border-[var(--slate-050)] flex-row items-center justify-between space-y-0">
              <SheetTitle className="text-[15px] font-medium tracking-[-0.005em]">
                Filter the sample
              </SheetTitle>
              <span className="text-[11px] font-mono numerics text-[var(--slate-400)]">
                n = {count.toLocaleString()} / {total.toLocaleString()}
              </span>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-7">
              <Group label="Geography">
                {GEO_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    onClick={() => updateFilters({ geo: o.value as Filters["geo"] })}
                    className={pillClass(filters.geo === o.value)}
                  >
                    {o.label}
                  </button>
                ))}
              </Group>

              <Group label="FI status">
                {FI_STATUS_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    onClick={() => updateFilters({ fi_status: o.value as Filters["fi_status"] })}
                    className={pillClass(filters.fi_status === o.value)}
                  >
                    {o.label}
                  </button>
                ))}
              </Group>

              <Group label="Household">
                {HOUSEHOLD_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    onClick={() => updateFilters({ household: o.value as Filters["household"] })}
                    className={pillClass(filters.household === o.value)}
                  >
                    {o.label}
                  </button>
                ))}
              </Group>

              <Group label="Flavor · multi-select">
                {FI_FLAVORS.map((f) => (
                  <button
                    key={f}
                    onClick={() => toggleFlavor(f)}
                    className={pillClass(filters.flavors.includes(f))}
                  >
                    {f.replace(" / Coast FI", "")}
                  </button>
                ))}
              </Group>

              <Group label="Age · multi-select">
                {AGE_BRACKETS.map((a) => (
                  <button
                    key={a}
                    onClick={() => toggleAge(a)}
                    className={pillClass(filters.age_brackets.includes(a))}
                  >
                    {a}
                  </button>
                ))}
              </Group>

              {/* Bias chip-strip — explains the sample, in the same drawer */}
              <div className="pt-2 border-t border-[var(--slate-050)]">
                <h4 className="text-[10px] font-medium tracking-[0.12em] uppercase text-[var(--slate-500)] mb-2.5">
                  About this sample
                </h4>
                <p className="text-[12px] text-[var(--slate-600)] leading-[1.55] mb-2">
                  Not a representative sample of Americans or of Reddit. This community skews:
                </p>
                <ul className="text-[12px] text-[var(--slate-500)] space-y-1">
                  <li>• High-earning</li>
                  <li>• US-based and English-speaking</li>
                  <li>• Tech-adjacent, mid-career</li>
                </ul>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[var(--slate-050)] flex items-center justify-between">
              <button
                onClick={reset}
                disabled={activeCount === 0}
                className="text-[12px] font-medium text-[var(--slate-600)] hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Reset all
              </button>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full px-5 py-2 text-[12px] font-medium bg-[var(--brand)] text-white hover:bg-[var(--brand-dark)] transition-colors"
              >
                {activeCount > 0
                  ? `Apply · ${count.toLocaleString()} results`
                  : "Done"}
              </button>
            </div>
          </SheetContent>
        </Sheet>

        {/* Sample count — desktop only */}
        <span
          className={cn(
            "hidden lg:block text-[11px] font-mono numerics",
            isSmallSample ? "text-amber-600 font-medium" : "text-[var(--slate-400)]",
          )}
        >
          n = {count.toLocaleString()} / {total.toLocaleString()}
        </span>
      </div>
    </header>
  );
}

/* ---------- atoms ---------- */

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-[10px] font-medium tracking-[0.12em] uppercase text-[var(--slate-500)] mb-2.5">
        {label}
      </h4>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function ActiveChip({ label, value, onClear }: { key?: string; label: string; value: string; onClear?: () => void }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full text-[11px] font-medium shrink-0"
      style={{ background: "var(--brand-soft)", color: "var(--brand-dark)", padding: "3px 4px 3px 10px" }}
    >
      <span className="opacity-70">{label}:</span>
      <span>{value}</span>
      {onClear && (
        <button
          onClick={onClear}
          aria-label={`Remove ${label} filter`}
          className="w-[16px] h-[16px] inline-flex items-center justify-center rounded-full hover:bg-[var(--brand)]/20 text-[10px] leading-none"
        >
          ×
        </button>
      )}
    </span>
  );
}

function FilterIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path
        d="M1 2.5h10M2.5 6h7M4 9.5h4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function buildChips(f: Filters): Array<{ key: string; label: string; value: string }> {
  const out: Array<{ key: string; label: string; value: string }> = [];
  if (f.geo !== "all") out.push({ key: "geo", label: "Geo", value: f.geo });
  if (f.fi_status !== "all") {
    const m: Record<string, string> = { pursuing: "Pursuing", fi: "Already FI", re: "Already RE" };
    out.push({ key: "status", label: "Status", value: m[f.fi_status] ?? f.fi_status });
  }
  if (f.household !== "all") {
    const m: Record<string, string> = { single: "Single", dual: "Dual" };
    out.push({ key: "household", label: "Household", value: m[f.household] ?? f.household });
  }
  if (f.flavors.length) out.push({ key: "flavor", label: "Flavor", value: `${f.flavors.length}` });
  if (f.age_brackets.length) out.push({ key: "age", label: "Age", value: `${f.age_brackets.length}` });
  return out;
}
