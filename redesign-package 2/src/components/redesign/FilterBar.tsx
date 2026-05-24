"use client";
import { useCallback, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

function pillClasses(active: boolean) {
  return cn(
    "px-2.5 py-0.5 rounded-full border text-[11px] font-medium transition-colors",
    active
      ? "bg-[var(--brand)] text-white border-[var(--brand)]"
      : "border-[var(--slate-050)] text-[var(--slate-600)] hover:border-[var(--brand)] hover:text-[var(--brand)]",
  );
}

export function FilterBar({ count, total }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const filters = paramsToFilters(searchParams);
  const isSmallSample = count < 30;

  const updateFilters = useCallback(
    (updates: Partial<Filters>) => {
      const next = { ...filters, ...updates };
      const params = filtersToParams(next);
      startTransition(() => {
        router.replace(`?${params.toString()}`, { scroll: false });
      });
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

  const isDefault =
    filters.geo === "all" &&
    filters.fi_status === "all" &&
    filters.flavors.length === 0 &&
    filters.age_brackets.length === 0 &&
    filters.household === "all";

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        background: "rgba(255,255,255,0.88)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderBottom: "1px solid var(--slate-050)",
      }}
    >
      <div className="max-w-7xl mx-auto px-6">
        {/* Title row */}
        <div className="flex items-center justify-between h-14 gap-6">
          <a href="#top" className="flex items-center gap-2.5 font-medium text-sm tracking-[-0.01em]">
            <span
              className="block w-[22px] h-[22px] rounded-md"
              style={{ background: "var(--gradient-brand-deep)" }}
              aria-hidden
            />
            <span>2025 FI Survey</span>
          </a>
          <nav className="hidden md:flex items-center gap-7 text-[13px] text-[var(--slate-600)]">
            <a href="#who" className="hover:text-foreground transition-colors">Who responded</a>
            <a href="#compare" className="hover:text-foreground transition-colors">Compare</a>
            <a href="#networth" className="hover:text-foreground transition-colors">Net worth</a>
            <a href="#fi-plan" className="hover:text-foreground transition-colors">The plan</a>
            <a href="#already-fi" className="hover:text-foreground transition-colors">Already FI</a>
          </nav>
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "text-[11px] font-mono numerics",
                isSmallSample ? "text-amber-600 font-medium" : "text-[var(--slate-400)]",
              )}
            >
              n = {count.toLocaleString()} / {total.toLocaleString()}
            </span>
            {!isDefault && (
              <button
                onClick={reset}
                className="text-[11px] font-medium text-[var(--brand)] hover:underline"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap gap-x-5 gap-y-2 items-center pb-3 text-[11px] text-[var(--slate-500)]">
          <FilterGroup label="Geo">
            {GEO_OPTIONS.map((o) => (
              <button
                key={o.value}
                onClick={() => updateFilters({ geo: o.value as Filters["geo"] })}
                className={pillClasses(filters.geo === o.value)}
              >
                {o.label}
              </button>
            ))}
          </FilterGroup>

          <FilterGroup label="Status">
            {FI_STATUS_OPTIONS.map((o) => (
              <button
                key={o.value}
                onClick={() => updateFilters({ fi_status: o.value as Filters["fi_status"] })}
                className={pillClasses(filters.fi_status === o.value)}
              >
                {o.label}
              </button>
            ))}
          </FilterGroup>

          <FilterGroup label="Household">
            {HOUSEHOLD_OPTIONS.map((o) => (
              <button
                key={o.value}
                onClick={() => updateFilters({ household: o.value as Filters["household"] })}
                className={pillClasses(filters.household === o.value)}
              >
                {o.label}
              </button>
            ))}
          </FilterGroup>

          <FilterGroup label="Flavor">
            {FI_FLAVORS.slice(0, 5).map((f) => (
              <button key={f} onClick={() => toggleFlavor(f)} className={pillClasses(filters.flavors.includes(f))}>
                {f.replace(" / Coast FI", "")}
              </button>
            ))}
          </FilterGroup>

          <FilterGroup label="Age">
            {AGE_BRACKETS.map((a) => (
              <button key={a} onClick={() => toggleAge(a)} className={pillClasses(filters.age_brackets.includes(a))}>
                {a}
              </button>
            ))}
          </FilterGroup>
        </div>
      </div>
    </header>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="font-medium text-[var(--slate-400)] uppercase tracking-[0.08em] mr-1">{label}</span>
      {children}
    </div>
  );
}
