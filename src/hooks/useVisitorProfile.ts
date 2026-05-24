"use client";
import { useCallback, useEffect, useState } from "react";
import type { SurveyResponse } from "@/lib/types";
import { percentileOf } from "@/lib/percentile";

export interface VisitorProfile {
  age_bracket: string;
  net_worth: number | null;
  income: number | null;
  fi_number: number | null;
  expenses: number | null;
  debt: number | null;
}

export interface VisitorResults {
  nw_pct_global: number | null;
  nw_pct_age: number | null;
  income_pct_global: number | null;
  fi_number_pct_global: number | null;
  expenses_pct_global: number | null;
  debt_pct_global: number | null;
  savings_rate: number | null;
  peer_cohort: SurveyResponse[];
}

const STORAGE_KEY = "fi_survey_visitor";
const EMPTY: VisitorProfile = {
  age_bracket: "31-35",
  net_worth: null,
  income: null,
  fi_number: null,
  expenses: null,
  debt: null,
};

function loadFromStorage(): VisitorProfile {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    return { ...EMPTY, ...JSON.parse(raw) };
  } catch {
    return EMPTY;
  }
}

function loadFromURL(): Partial<VisitorProfile> {
  if (typeof window === "undefined") return {};
  const p = new URLSearchParams(window.location.search);
  const out: Partial<VisitorProfile> = {};
  const nw = p.get("v_nw");   if (nw)  out.net_worth    = parseFloat(nw);
  const inc = p.get("v_inc"); if (inc) out.income        = parseFloat(inc);
  const fi  = p.get("v_fi");  if (fi)  out.fi_number     = parseFloat(fi);
  const exp = p.get("v_exp"); if (exp) out.expenses      = parseFloat(exp);
  const dbt = p.get("v_debt");if (dbt) out.debt          = parseFloat(dbt);
  const age = p.get("v_age"); if (age) out.age_bracket   = age;
  return out;
}

function sortedNonNull(rows: SurveyResponse[], getter: (r: SurveyResponse) => number | null): number[] {
  return rows
    .map(getter)
    .filter((v): v is number => v !== null)
    .sort((a, b) => a - b);
}

export function useVisitorProfile(allRows: SurveyResponse[]) {
  const [profile, setProfileRaw] = useState<VisitorProfile>(EMPTY);

  useEffect(() => {
    const fromURL = loadFromURL();
    const hasURLData = Object.keys(fromURL).length > 0;
    const base = hasURLData ? { ...loadFromStorage(), ...fromURL } : loadFromStorage();
    setProfileRaw(base);
  }, []);

  const setProfile = useCallback((updates: Partial<VisitorProfile>) => {
    setProfileRaw((prev) => {
      const next = { ...prev, ...updates };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const results: VisitorResults = (() => {
    const byAge = allRows.filter((r) => r.age_bracket === profile.age_bracket);

    const allNW = sortedNonNull(allRows, (r) => r.assets.total);
    const ageNW = sortedNonNull(byAge, (r) => r.assets.total);
    const allInc = sortedNonNull(allRows, (r) => r.income.total);
    const allFI = sortedNonNull(allRows, (r) => r.fi_number);
    const allExp = sortedNonNull(allRows, (r) => r.expenses.total);
    const allDebt = sortedNonNull(allRows, (r) => r.debts.total);

    const nw = profile.net_worth;
    const inc = profile.income;
    const fin = profile.fi_number;
    const exp = profile.expenses;
    const debt = profile.debt;

    const annualSavings = inc !== null && exp !== null ? inc - exp : null;
    const savingsRate = inc && inc > 0 && annualSavings !== null
      ? Math.round((annualSavings / inc) * 100)
      : null;

    // Peer cohort: 20 nearest by age+NW (same age bracket, closest NW)
    let peerCohort: SurveyResponse[] = [];
    if (nw !== null) {
      peerCohort = [...byAge]
        .filter((r) => r.assets.total !== null)
        .sort((a, b) => Math.abs((a.assets.total ?? 0) - nw) - Math.abs((b.assets.total ?? 0) - nw))
        .slice(0, 20);
    }

    return {
      nw_pct_global: nw !== null ? percentileOf(allNW, nw) : null,
      nw_pct_age: nw !== null ? percentileOf(ageNW, nw) : null,
      income_pct_global: inc !== null ? percentileOf(allInc, inc) : null,
      fi_number_pct_global: fin !== null ? percentileOf(allFI, fin) : null,
      expenses_pct_global: exp !== null ? percentileOf(allExp, exp) : null,
      debt_pct_global: debt !== null ? percentileOf(allDebt, debt) : null,
      savings_rate: savingsRate,
      peer_cohort: peerCohort,
    };
  })();

  return { profile, setProfile, results };
}
