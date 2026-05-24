"use client";
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from "recharts";
import { formatDollar, percentileValue } from "@/lib/percentile";
import { AGE_BRACKETS } from "@/lib/types";
import type { SurveyResponse } from "@/lib/types";
import { SectionHeader } from "./SectionHeader";
import { CHART, BRAND, EXPENSE_COLORS, INCOME_COLORS } from "@/lib/redesign/theme";

function medianOf(vals: number[]) {
  if (!vals.length) return null;
  const s = [...vals].sort((a, b) => a - b);
  return percentileValue(s, 50);
}

const EXP_CATEGORIES: Array<{ key: keyof SurveyResponse["expenses"]; label: string }> = [
  { key: "housing", label: "Housing" },
  { key: "taxes", label: "Taxes" },
  { key: "tax_adv_inv", label: "Tax-adv inv." },
  { key: "non_tax_adv_sav", label: "Savings" },
  { key: "luxuries", label: "Luxuries" },
  { key: "necessities", label: "Necessities" },
  { key: "transport", label: "Transport" },
  { key: "healthcare", label: "Healthcare" },
  { key: "utilities", label: "Utilities" },
  { key: "children", label: "Children" },
  { key: "charity", label: "Charity" },
  { key: "debt", label: "Debt repayment" },
];

const INC_CATEGORIES: Array<{ key: keyof SurveyResponse["income"]; label: string }> = [
  { key: "wages", label: "Wages" },
  { key: "employer_match", label: "Employer match/ESPP" },
  { key: "cap_gains", label: "Cap gains/dividends" },
  { key: "rental", label: "Rental/business" },
  { key: "self_emp", label: "Self-employment" },
  { key: "other", label: "Other" },
];

const TOGGLE_BASE =
  "text-[11px] px-3 py-1 rounded-full border transition-colors font-medium";

export function IncomeExpensesSection({
  rows,
}: {
  rows: SurveyResponse[];
  visitorIncome?: number | null;
  visitorExpenses?: number | null;
}) {
  const [expGroupBy, setExpGroupBy] = useState<"age" | "fi_status">("age");

  const expByAge = AGE_BRACKETS.map((bracket) => {
    const byAge = rows.filter((r) => r.age_bracket === bracket);
    const result: Record<string, number | string> = { bracket };
    EXP_CATEGORIES.forEach(({ key, label }) => {
      const vals = byAge.map((r) => r.expenses[key]).filter((v): v is number => v !== null && v > 0);
      result[label] = medianOf(vals) ?? 0;
    });
    return result;
  });

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

  const savingsRateByAge = AGE_BRACKETS.map((bracket) => {
    const byAge = rows.filter((r) => r.age_bracket === bracket);
    const rates = byAge
      .map((r) => {
        const inc = r.income.total;
        const exp = r.expenses.total;
        if (!inc || !exp || inc <= 0) return null;
        return ((inc - exp) / inc) * 100;
      })
      .filter((v): v is number => v !== null && v >= -100 && v <= 100);
    return { bracket, rate: medianOf(rates) };
  }).filter((d) => d.rate !== null);

  const allSavingsRates = rows
    .map((r) => {
      const inc = r.income.total;
      const exp = r.expenses.total;
      if (!inc || !exp || inc <= 0) return null;
      return ((inc - exp) / inc) * 100;
    })
    .filter((v): v is number => v !== null && v >= -100 && v <= 100);
  const medSavingsRate = medianOf(allSavingsRates);

  const expData = expGroupBy === "age" ? expByAge : expByFI;
  const moduleClass = "bg-white border border-[var(--slate-050)] rounded-xl p-6";

  return (
    <section data-section id="income-expenses">
      <SectionHeader
        number="05"
        eyebrow="How they live"
        title="Income and expenses."
        lede={
          <>
            Housing and taxes dominate the expense side. On the income side, capital gains and
            dividends rise sharply once FI is reached — wages get <em>replaced</em>, not just
            reduced.
          </>
        }
      />

      {/* Expense composition */}
      <div className={`${moduleClass} mb-6`}>
        <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
          <h3 className="text-[13px] font-medium text-foreground">Median expense composition</h3>
          <div className="flex gap-2">
            {(["age", "fi_status"] as const).map((g) => (
              <button
                key={g}
                onClick={() => setExpGroupBy(g)}
                className={
                  expGroupBy === g
                    ? `${TOGGLE_BASE} bg-[var(--brand)] text-white border-[var(--brand)]`
                    : `${TOGGLE_BASE} border-[var(--slate-050)] text-[var(--slate-500)] hover:border-[var(--brand)]`
                }
              >
                {g === "age" ? "By age" : "By FI status"}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={290}>
          <BarChart data={expData} margin={{ top: 5, right: 20, left: 60, bottom: 0 }}>
            <CartesianGrid strokeDasharray={CHART.gridlineDashed} stroke={CHART.gridline} vertical={false} />
            <XAxis dataKey="bracket" tick={{ fontSize: 12, fill: CHART.axisLabel }} axisLine={false} tickLine={false} />
            <YAxis
              tickFormatter={(v) => formatDollar(v, true)}
              tick={{ fontSize: 12, fill: CHART.axisLabel }}
              axisLine={false}
              tickLine={false}
              width={58}
            />
            <Tooltip
              formatter={(v, name) => [formatDollar(Number(v)), name]}
              contentStyle={{ fontSize: 11, borderColor: CHART.tooltipBorder, borderRadius: 8 }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {EXP_CATEGORIES.map(({ label }) => (
              <Bar key={label} dataKey={label} stackId="a" fill={EXPENSE_COLORS[label]} maxBarSize={64} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Income & savings rate side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={moduleClass}>
          <h3 className="text-[13px] font-medium text-foreground mb-1">Income source by FI status</h3>
          <p className="text-[12px] text-[var(--slate-400)] mb-4">
            Capital gains and dividends rise sharply once FI is reached.
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={incByFI} margin={{ top: 5, right: 10, left: 50, bottom: 0 }}>
              <CartesianGrid strokeDasharray={CHART.gridlineDashed} stroke={CHART.gridline} vertical={false} />
              <XAxis dataKey="bracket" tick={{ fontSize: 12, fill: CHART.axisLabel }} axisLine={false} tickLine={false} />
              <YAxis
                tickFormatter={(v) => formatDollar(v, true)}
                tick={{ fontSize: 12, fill: CHART.axisLabel }}
                axisLine={false}
                tickLine={false}
                width={50}
              />
              <Tooltip
                formatter={(v, name) => [formatDollar(Number(v)), name]}
                contentStyle={{ fontSize: 11, borderColor: CHART.tooltipBorder, borderRadius: 8 }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {INC_CATEGORIES.map(({ label }) => (
                <Bar key={label} dataKey={label} stackId="a" fill={INCOME_COLORS[label]} maxBarSize={60} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className={moduleClass}>
          <h3 className="text-[13px] font-medium text-foreground mb-1">Implied savings rate by age</h3>
          <p className="text-[12px] text-[var(--slate-400)] mb-4">
            (income − expenses) / income · median per bracket.
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={savingsRateByAge} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray={CHART.gridlineDashed} stroke={CHART.gridline} vertical={false} />
              <XAxis dataKey="bracket" tick={{ fontSize: 12, fill: CHART.axisLabel }} axisLine={false} tickLine={false} />
              <YAxis
                tickFormatter={(v) => `${v.toFixed(0)}%`}
                tick={{ fontSize: 12, fill: CHART.axisLabel }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(v) => [`${Number(v).toFixed(1)}%`, "median savings rate"]}
                contentStyle={{ fontSize: 12, borderColor: CHART.tooltipBorder, borderRadius: 8 }}
              />
              <ReferenceLine y={0} stroke={CHART.refLineMuted} />
              <Bar dataKey="rate" fill={BRAND.green} radius={[3, 3, 0, 0]} maxBarSize={40} />
              {medSavingsRate !== null && (
                <ReferenceLine
                  y={medSavingsRate}
                  stroke={BRAND.green}
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                  label={({ viewBox }) => {
                    const { x = 0, y = 0 } = (viewBox as { x?: number; y?: number }) ?? {};
                    const label = `MED ${medSavingsRate.toFixed(0)}%`;
                    const w = label.length * 6.5 + 16;
                    return (
                      <g transform={`translate(${x + 4}, ${y})`}>
                        <rect x={0} y={-9} width={w} height={18} rx={9} fill={BRAND.green} />
                        <text x={w / 2} y={4} textAnchor="middle" fontSize={10} fontWeight={500} fill="white" letterSpacing="0.04em">
                          {label}
                        </text>
                      </g>
                    );
                  }}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
