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
import { WithdrawalPlansSection } from "@/components/redesign/WithdrawalPlansSection";
import { YearsToFISection } from "@/components/redesign/YearsToFISection";
import { AlreadyFISection } from "@/components/redesign/AlreadyFISection";
import { NotableFindingsSection } from "@/components/redesign/NotableFindingsSection";
import { MethodologySection } from "@/components/redesign/MethodologySection";
import { CompareSection } from "@/components/redesign/CompareSection";
import { MacroMoodSection } from "@/components/redesign/MacroMoodSection";
import { TopNav } from "@/components/redesign/TopNav";
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
      <TopNav />
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

        {/* 07 Withdrawal plans */}
        <WithdrawalPlansSection rows={filteredRows} />

        {/* 08 Years to FI */}
        <YearsToFISection rows={filteredRows} />

        {/* 09 Already FI cohort */}
        <AlreadyFISection rows={filteredRows} />

        {/* 10 Notable findings */}
        <NotableFindingsSection rows={filteredRows} />

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
        <div className="max-w-7xl mx-auto px-6 py-16">
          <h3 className="text-[clamp(28px,3vw,40px)] font-medium leading-[1.1] tracking-[-0.02em] max-w-[22ch] mb-4">
            An annual self-portrait of a community walking toward financial independence.
          </h3>
          <p className="text-white/70 max-w-[60ch] leading-[1.55]">
            {pc.total.toLocaleString()} self-reported responses · collected April–May 2025 ·
            anonymized response-level data available on request.
          </p>
          <div className="flex flex-wrap gap-8 mt-10 pt-6 border-t border-white/12 text-[13px] text-white/60">
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
            <span className="ml-auto text-white/40">2025 community survey</span>
          </div>
        </div>
      </footer>
    </>
  );
}
