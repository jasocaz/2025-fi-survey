"use client";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { FilterBar } from "@/components/redesign/FilterBar";
import { HeroSection } from "@/components/redesign/HeroSection";
import { CompareSection } from "@/components/redesign/CompareSection";
import { WhoRespondedSection } from "@/components/redesign/WhoRespondedSection";
import { NetWorthSection } from "@/components/redesign/NetWorthSection";
import { FIPlanSection } from "@/components/redesign/FIPlanSection";
import { IncomeExpensesSection } from "@/components/redesign/IncomeExpensesSection";
import { MacroMoodSection } from "@/components/redesign/MacroMoodSection";
import { AlreadyFISection } from "@/components/redesign/AlreadyFISection";
import { MethodologySection } from "@/components/redesign/MethodologySection";
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
        <HeroSection rows={filteredRows} precomputed={pc} />
        <WhoRespondedSection rows={filteredRows} />
        <CompareSection allRows={allRows} precomputed={pc} />
        <NetWorthSection
          rows={filteredRows}
          precomputed={pc}
          visitorNW={profile.net_worth}
          visitorDebt={profile.debt}
          visitorAgeBracket={profile.age_bracket}
        />
        <FIPlanSection
          rows={filteredRows}
          visitorFINumber={profile.fi_number}
        />
        <IncomeExpensesSection
          rows={filteredRows}
          visitorIncome={profile.income}
          visitorExpenses={profile.expenses}
        />
        <MacroMoodSection rows={filteredRows} />
        <AlreadyFISection rows={filteredRows} />
        <MethodologySection total={pc.total} completed={pc.completed} />
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
