"use client";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { FilterBar } from "@/components/FilterBar";
import { HeroSection } from "@/components/sections/HeroSection";
import { CompareSection } from "@/components/sections/CompareSection";
import { WhoRespondedSection } from "@/components/sections/WhoRespondedSection";
import { NetWorthSection } from "@/components/sections/NetWorthSection";
import { FIPlanSection } from "@/components/sections/FIPlanSection";
import { IncomeExpensesSection } from "@/components/sections/IncomeExpensesSection";
import { MacroMoodSection } from "@/components/sections/MacroMoodSection";
import { AlreadyFISection } from "@/components/sections/AlreadyFISection";
import { MethodologySection } from "@/components/sections/MethodologySection";
import { useVisitorProfile } from "@/hooks/useVisitorProfile";
import { applyFilters, paramsToFilters } from "@/lib/filters";
import type { SurveyResponse, Precomputed } from "@/lib/types";
import responsesData from "@/app/data/responses.json";
import precomputedData from "@/app/data/precomputed.json";

const allRows = responsesData as unknown as SurveyResponse[];
const pc = precomputedData as unknown as Precomputed;

export default function OldVersionPage() {
  const searchParams = useSearchParams();
  const filters = paramsToFilters(searchParams);
  const filteredRows = useMemo(() => applyFilters(allRows, filters), [filters]);
  const { profile } = useVisitorProfile(allRows);

  return (
    <main>
      <FilterBar count={filteredRows.length} total={allRows.length} />
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
  );
}
