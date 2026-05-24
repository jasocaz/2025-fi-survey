"use client";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { FilterBar } from "@/components/redesign/FilterBar";
import { HeroSection } from "@/components/redesign/HeroSection";
import { MethodologySnapshotSection } from "@/components/redesign/MethodologySnapshotSection";
import { WhoRespondedSection } from "@/components/redesign/WhoRespondedSection";
import { NetWorthSection } from "@/components/redesign/NetWorthSection";
import { FIPlanSection } from "@/components/redesign/FIPlanSection";
import { IncomeExpensesSection } from "@/components/redesign/IncomeExpensesSection";
import { AllocationSection } from "@/components/redesign/AllocationSection";
import { YearsToFISection } from "@/components/redesign/YearsToFISection";
import { AlreadyFISection } from "@/components/redesign/AlreadyFISection";
import { NotableFindingsSection } from "@/components/redesign/NotableFindingsSection";
import { CrossTabsSection } from "@/components/redesign/CrossTabsSection";
import { MethodologySection } from "@/components/redesign/MethodologySection";
import { CompareSection } from "@/components/redesign/CompareSection";
import { MacroMoodSection } from "@/components/redesign/MacroMoodSection";
import { TipJarPopup } from "@/components/redesign/TipJarPopup";
import { useVisitorProfile } from "@/hooks/useVisitorProfile";
import { applyFilters, paramsToFilters } from "@/lib/filters";
import type { SurveyResponse, Precomputed } from "@/lib/types";
import responsesData from "@/app/data/responses.json";
import precomputedData from "@/app/data/precomputed.json";

const allRows = responsesData as unknown as SurveyResponse[];
const pc = precomputedData as unknown as Precomputed;

export default function SurveyPage() {
  const searchParams = useSearchParams();
  const filters = paramsToFilters(searchParams);
  const filteredRows = useMemo(() => applyFilters(allRows, filters), [filters]);
  const { profile } = useVisitorProfile(allRows);

  return (
    <div data-theme="redesign">
      <FilterBar count={filteredRows.length} total={allRows.length} />
      <main id="top">
        {/* 01 Hero */}
        <HeroSection rows={filteredRows} precomputed={pc} />

        {/* 01 Methodology snapshot */}
        <MethodologySnapshotSection precomputed={pc} />

        {/* 02 Who responded */}
        <WhoRespondedSection rows={filteredRows} />

        {/* 03 Net worth */}
        <NetWorthSection
          rows={filteredRows}
          precomputed={pc}
          visitorNW={profile.net_worth}
          visitorDebt={profile.debt}
          visitorAgeBracket={profile.age_bracket}
        />

        {/* 04 FI targets */}
        <FIPlanSection
          rows={filteredRows}
          visitorFINumber={profile.fi_number}
        />

        {/* 05 Income & expenses */}
        <IncomeExpensesSection
          rows={filteredRows}
          visitorIncome={profile.income}
          visitorExpenses={profile.expenses}
        />

        {/* 06 Allocation */}
        <AllocationSection rows={filteredRows} />

        {/* 07 Years to FI */}
        <YearsToFISection rows={filteredRows} />

        {/* 08 Already FI cohort */}
        <AlreadyFISection rows={filteredRows} />

        {/* 09 Notable findings — punchy stats */}
        <NotableFindingsSection rows={filteredRows} />

        {/* 10 Cross-tab insights — patterns the headline numbers don't show */}
        <CrossTabsSection rows={filteredRows} />

        {/* 11 Methodology */}
        <MethodologySection total={pc.total} completed={pc.completed} />

        {/* 12 Compare (kept, restyled via scoped CSS) */}
        <CompareSection allRows={allRows} precomputed={pc} />

        {/* 13 Macro mood */}
        <MacroMoodSection rows={filteredRows} />
      </main>

      <footer
        className="text-white"
        style={{ background: "var(--gradient-navy)" }}
      >
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-wrap gap-8 text-[13px] text-white/60">
            <a href="#top" className="hover:text-white transition-colors">Back to top</a>
            <a
              href="https://docs.google.com/spreadsheets/d/1hGPJf_H07ph6idv6AqEO9MHNCD9icp3N/edit?gid=1578869259#gid=1578869259"
              target="_blank"
              rel="noopener"
              className="hover:text-white transition-colors"
            >
              Raw Data ↗
            </a>
            <a
              href="https://www.reddit.com/r/financialindependence/"
              target="_blank"
              rel="noopener"
              className="hover:text-white transition-colors"
            >
              r/financialindependence ↗
            </a>
            <div className="ml-auto flex flex-col items-end gap-1 text-white/60">
              <span>
                Made with love by{" "}
                <a
                  href="https://www.reddit.com/user/FIREdupforRE/"
                  target="_blank"
                  rel="noopener"
                  className="text-white hover:underline"
                >
                  u/FIREdupforRE
                </a>
              </span>
              <span>
                Liked this?{" "}
                <a
                  href="https://buy.stripe.com/3cIfZ22pHe3SaBHe799k404"
                  target="_blank"
                  rel="noopener"
                  className="text-white hover:underline"
                >
                  Buy me a coffee
                </a>
              </span>
            </div>
          </div>
        </div>
      </footer>

      <TipJarPopup />
    </div>
  );
}
