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
import { MethodologySection } from "@/components/redesign/MethodologySection";
import { CompareSection } from "@/components/redesign/CompareSection";
import { MacroMoodSection } from "@/components/redesign/MacroMoodSection";
import { useVisitorProfile } from "@/hooks/useVisitorProfile";
import { applyFilters, paramsToFilters } from "@/lib/filters";
import type { SurveyResponse, Precomputed } from "@/lib/types";
import responsesData from "@/app/data/responses.json";
import precomputedData from "@/app/data/precomputed.json";

const allRows = responsesData as unknown as SurveyResponse[];
const pc = precomputedData as unknown as Precomputed;

export default function SurveyRedesignPage() {
  const searchParams = useSearchParams();
  const filters = paramsToFilters(searchParams);
  const filteredRows = useMemo(() => applyFilters(allRows, filters), [filters]);
  const { profile } = useVisitorProfile(allRows);

  return (
    <>
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

        {/* 09 Notable findings */}
        <NotableFindingsSection rows={filteredRows} />

        {/* 10 Methodology */}
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
            <a href="#methodology" className="hover:text-white transition-colors">Methodology</a>
            <a
              href="https://www.reddit.com/r/financialindependence/"
              target="_blank"
              rel="noopener"
              className="hover:text-white transition-colors"
            >
              r/financialindependence ↗
            </a>
            <span className="ml-auto text-white/60">
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
          </div>
        </div>
      </footer>
    </>
  );
}
