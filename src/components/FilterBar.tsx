"use client";
import { useCallback, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Filters } from "@/lib/types";
import { AGE_BRACKETS, DEFAULT_FILTERS, FI_FLAVORS } from "@/lib/types";
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
    <div className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-6 py-3">
        {/* Title row */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <span className="text-xs font-semibold tracking-widest text-stone-400 uppercase">
              r/financialindependence
            </span>
            <h1 className="text-sm font-semibold text-stone-800 leading-tight">
              2025 Survey Results for /r/financialindependence
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className={cn("text-xs font-mono", isSmallSample ? "text-amber-600 font-semibold" : "text-stone-400")}>
              n = {count.toLocaleString()} / {total.toLocaleString()}
            </span>
            {isSmallSample && (
              <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs">
                small sample
              </Badge>
            )}
            {!isDefault && (
              <Button variant="ghost" size="sm" onClick={reset} className="text-xs text-[#0a7d4a] h-6 px-2">
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 items-center text-xs text-stone-500">
          {/* Geo */}
          <div className="flex items-center gap-1">
            <span className="font-medium">Geo:</span>
            {GEO_OPTIONS.map((o) => (
              <button
                key={o.value}
                onClick={() => updateFilters({ geo: o.value as Filters["geo"] })}
                className={cn(
                  "px-2 py-0.5 rounded-full border text-xs transition-colors",
                  filters.geo === o.value
                    ? "bg-[#0a7d4a] text-white border-[#0a7d4a]"
                    : "border-stone-200 hover:border-[#0a7d4a] hover:text-[#0a7d4a]",
                )}
              >
                {o.label}
              </button>
            ))}
          </div>

          {/* FI Status */}
          <div className="flex items-center gap-1">
            <span className="font-medium">Status:</span>
            {FI_STATUS_OPTIONS.map((o) => (
              <button
                key={o.value}
                onClick={() => updateFilters({ fi_status: o.value as Filters["fi_status"] })}
                className={cn(
                  "px-2 py-0.5 rounded-full border text-xs transition-colors",
                  filters.fi_status === o.value
                    ? "bg-[#0a7d4a] text-white border-[#0a7d4a]"
                    : "border-stone-200 hover:border-[#0a7d4a] hover:text-[#0a7d4a]",
                )}
              >
                {o.label}
              </button>
            ))}
          </div>

          {/* Household */}
          <div className="flex items-center gap-1">
            <span className="font-medium">Household:</span>
            {HOUSEHOLD_OPTIONS.map((o) => (
              <button
                key={o.value}
                onClick={() => updateFilters({ household: o.value as Filters["household"] })}
                className={cn(
                  "px-2 py-0.5 rounded-full border text-xs transition-colors",
                  filters.household === o.value
                    ? "bg-[#0a7d4a] text-white border-[#0a7d4a]"
                    : "border-stone-200 hover:border-[#0a7d4a] hover:text-[#0a7d4a]",
                )}
              >
                {o.label}
              </button>
            ))}
          </div>

          {/* Flavor multi-select */}
          <div className="flex items-center gap-1 flex-wrap">
            <span className="font-medium">Flavor:</span>
            {FI_FLAVORS.slice(0, 5).map((f) => (
              <button
                key={f}
                onClick={() => toggleFlavor(f)}
                className={cn(
                  "px-2 py-0.5 rounded-full border text-xs transition-colors",
                  filters.flavors.includes(f)
                    ? "bg-[#0a7d4a] text-white border-[#0a7d4a]"
                    : "border-stone-200 hover:border-[#0a7d4a] hover:text-[#0a7d4a]",
                )}
              >
                {f.replace(" / Coast FI", "")}
              </button>
            ))}
          </div>

          {/* Age bracket multi-select */}
          <div className="flex items-center gap-1 flex-wrap">
            <span className="font-medium">Age:</span>
            {AGE_BRACKETS.map((a) => (
              <button
                key={a}
                onClick={() => toggleAge(a)}
                className={cn(
                  "px-2 py-0.5 rounded-full border text-xs transition-colors",
                  filters.age_brackets.includes(a)
                    ? "bg-[#0a7d4a] text-white border-[#0a7d4a]"
                    : "border-stone-200 hover:border-[#0a7d4a] hover:text-[#0a7d4a]",
                )}
              >
                {a}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
