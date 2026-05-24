"use client";
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from "recharts";
import { formatDollar, percentileValue } from "@/lib/percentile";
import { AGE_BRACKETS } from "@/lib/types";
import type { SurveyResponse } from "@/lib/types";

function medianOf(vals: number[]) {
  if (!vals.length) return null;
  const s = [...vals].sort((a,b) => a - b);
  return percentileValue(s, 50);
}

const EXP_CATEGORIES: Array<{ key: keyof SurveyResponse["expenses"]; label: string; color: string }> = [
  { key: "housing", label: "Housing", color: "#0a5530" },
  { key: "taxes", label: "Taxes", color: "#0a7d4a" },
  { key: "tax_adv_inv", label: "Tax-adv inv.", color: "#2e9e68" },
  { key: "non_tax_adv_sav", label: "Savings", color: "#5fb085" },
  { key: "luxuries", label: "Luxuries", color: "#8ccbad" },
  { key: "necessities", label: "Necessities", color: "#b2dcc4" },
  { key: "transport", label: "Transport", color: "#d6eedf" },
  { key: "healthcare", label: "Healthcare", color: "#e8d68a" },
  { key: "utilities", label: "Utilities", color: "#e0b84a" },
  { key: "children", label: "Children", color: "#c4503c" },
  { key: "charity", label: "Charity", color: "#d4927a" },
  { key: "debt", label: "Debt repayment", color: "#cccac0" },
];

const INC_CATEGORIES: Array<{ key: keyof SurveyResponse["income"]; label: string; color: string }> = [
  { key: "wages", label: "Wages", color: "#0a5530" },
  { key: "employer_match", label: "Employer match/ESPP", color: "#0a7d4a" },
  { key: "cap_gains", label: "Cap gains/dividends", color: "#5fb085" },
  { key: "rental", label: "Rental/business", color: "#b2dcc4" },
  { key: "self_emp", label: "Self-employment", color: "#e0b84a" },
  { key: "other", label: "Other", color: "#cccac0" },
];

export function IncomeExpensesSection({ rows, visitorIncome, visitorExpenses }: {
  rows: SurveyResponse[];
  visitorIncome?: number | null;
  visitorExpenses?: number | null;
}) {
  const [expGroupBy, setExpGroupBy] = useState<"age" | "fi_status">("age");

  // Expense composition by age bracket
  const expByAge = AGE_BRACKETS.map((bracket) => {
    const byAge = rows.filter((r) => r.age_bracket === bracket);
    const result: Record<string, number | string> = { bracket };
    EXP_CATEGORIES.forEach(({ key, label }) => {
      const vals = byAge.map((r) => r.expenses[key]).filter((v): v is number => v !== null && v > 0);
      result[label] = medianOf(vals) ?? 0;
    });
    return result;
  });

  // Expense by FI status
  const expByFI = [
    { bracket: "Pursuing FI", filter: (r: SurveyResponse) => !r.is_fi && !r.is_re },
    { bracket: "Already FI", filter: (r: SurveyResponse) => !!r.is_fi && !r.is_re },
    { bracket: "Retired", filter: (r: SurveyResponse) => !!r.is_re },
  ].map(({ bracket, filter }) => {
    const subset = rows.filter(filter);
    const result: Record<string, number | string> = { bracket };
    EXP_CATEGORIES.forEach(({ key, label }) => {
      const vals = subset.map((r) => r.expenses[key]).filter((v): v is number => v !== null && v > 0);
      result[label] = medianOf(vals) ?? 0;
    });
    return result;
  });

  // Income by FI status
  const incByFI = [
    { bracket: "Pursuing FI", filter: (r: SurveyResponse) => !r.is_fi && !r.is_re },
    { bracket: "Already FI", filter: (r: SurveyResponse) => !!r.is_fi && !r.is_re },
    { bracket: "Retired", filter: (r: SurveyResponse) => !!r.is_re },
  ].map(({ bracket, filter }) => {
    const subset = rows.filter(filter);
    const result: Record<string, number | string> = { bracket };
    INC_CATEGORIES.forEach(({ key, label }) => {
      const vals = subset.map((r) => r.income[key]).filter((v): v is number => v !== null && v > 0);
      result[label] = medianOf(vals) ?? 0;
    });
    return result;
  });

  // Savings rate by age
  const savingsRateByAge = AGE_BRACKETS.map((bracket) => {
    const byAge = rows.filter((r) => r.age_bracket === bracket);
    const rates = byAge
      .map((r) => {
        const inc = r.income.total;
        const exp = r.expenses.total;
        const taxes = r.expenses.taxes ?? 0;
        if (!inc || !exp || inc <= 0) return null;
        return ((inc - exp) / inc) * 100;
      })
      .filter((v): v is number => v !== null && v >= -100 && v <= 100);
    return { bracket, rate: medianOf(rates) };
  }).filter((d) => d.rate !== null);

  const expData = expGroupBy === "age" ? expByAge : expByFI;

  return (
    <section className="max-w-7xl mx-auto px-6 py-8 border-t border-stone-100">
      <p className="text-xs font-semibold tracking-widest text-stone-600 uppercase mb-1">§05</p>
      <h2 className="font-serif text-3xl font-semibold text-stone-900 mb-6">Income &amp; expenses</h2>

      {/* Expense composition */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-semibold text-stone-700">Median expense composition</h3>
          <div className="flex gap-2">
            {(["age","fi_status"] as const).map((g) => (
              <button
                key={g}
                onClick={() => setExpGroupBy(g)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${expGroupBy === g ? "bg-[#0a7d4a] text-white border-[#0a7d4a]" : "border-stone-200 text-stone-500 hover:border-[#0a7d4a]"}`}
              >
                {g === "age" ? "By age" : "By FI status"}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={expData} margin={{ top: 5, right: 20, left: 60, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0ede6" vertical={false} />
            <XAxis dataKey="bracket" tick={{ fontSize: 10, fill: "#78716c" }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={(v) => formatDollar(v, true)} tick={{ fontSize: 10, fill: "#78716c" }} axisLine={false} tickLine={false} width={58} />
            <Tooltip formatter={(v, name) => [formatDollar(Number(v)), name]} contentStyle={{ fontSize: 11, borderColor: "#e6e3d9" }} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            {EXP_CATEGORIES.map(({ label, color }) => (
              <Bar key={label} dataKey={label} stackId="a" fill={color} maxBarSize={64} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Income by FI status + Savings rate — side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h3 className="text-sm font-semibold text-stone-700 mb-1">Income source by FI status</h3>
          <p className="text-xs text-stone-400 mb-3">
            Capital gains and dividends rise sharply once FI is reached — wages are replaced, not just reduced.
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={incByFI} margin={{ top: 5, right: 10, left: 50, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ede6" vertical={false} />
              <XAxis dataKey="bracket" tick={{ fontSize: 10, fill: "#78716c" }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => formatDollar(v, true)} tick={{ fontSize: 10, fill: "#78716c" }} axisLine={false} tickLine={false} width={50} />
              <Tooltip formatter={(v, name) => [formatDollar(Number(v)), name]} contentStyle={{ fontSize: 11, borderColor: "#e6e3d9" }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              {INC_CATEGORIES.map(({ label, color }) => (
                <Bar key={label} dataKey={label} stackId="a" fill={color} maxBarSize={60} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-stone-700 mb-1">Implied savings rate by age</h3>
          <p className="text-xs text-stone-400 mb-3">(income − expenses) / income · median per bracket</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={savingsRateByAge} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ede6" vertical={false} />
              <XAxis dataKey="bracket" tick={{ fontSize: 10, fill: "#78716c" }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => `${v.toFixed(0)}%`} tick={{ fontSize: 10, fill: "#78716c" }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => [`${Number(v).toFixed(1)}%`, "median savings rate"]} contentStyle={{ fontSize: 12, borderColor: "#e6e3d9" }} />
              <ReferenceLine y={0} stroke="#d6d3cb" />
              <Bar dataKey="rate" fill="#0a7d4a" radius={[3, 3, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
