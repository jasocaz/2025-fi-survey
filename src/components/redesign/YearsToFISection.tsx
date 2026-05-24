"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import type { SurveyResponse } from "@/lib/types";
import { SectionHeader } from "./SectionHeader";
import { CHART, BRAND } from "@/lib/redesign/theme";
import { median } from "@/lib/percentile";

const REAL_RETURN = 0.07;

function yearsToFI(r: SurveyResponse): number | null {
  const target = r.fi_number;
  const current = r.assets.total;
  if (!target || !current || target <= 0) return null;
  if (current >= target) return 0;

  const inc = r.income.total;
  const exp = r.expenses.total;
  const annualSavings = inc !== null && exp !== null && inc > exp ? inc - exp : null;

  if (annualSavings === null || annualSavings <= 0) {
    if (REAL_RETURN > 0) {
      const n = Math.log(target / current) / Math.log(1 + REAL_RETURN);
      return n > 0 && n < 80 ? n : null;
    }
    return null;
  }

  let pv = current;
  for (let year = 1; year <= 60; year++) {
    pv = pv * (1 + REAL_RETURN) + annualSavings;
    if (pv >= target) return year;
  }
  return null;
}

function MedianPill({ x, y, label }: { x?: number; y?: number; label: string }) {
  const px = x ?? 0;
  const py = y ?? 0;
  const w = label.length * 6.5 + 16;
  return (
    <g transform={`translate(${px}, ${py - 12})`}>
      <rect x={-w / 2} y={-16} width={w} height={18} rx={9} fill={BRAND.green} />
      <text x={0} y={-3} textAnchor="middle" fontSize={10} fontWeight={500} fill="white" letterSpacing="0.04em">
        {label}
      </text>
    </g>
  );
}

export function YearsToFISection({ rows }: { rows: SurveyResponse[] }) {
  const alreadyFIRows = rows.filter((r) => r.is_fi);
  const pursuingRows = rows.filter((r) => !r.is_fi);

  const yearsData = pursuingRows
    .map(yearsToFI)
    .filter((v): v is number => v !== null && v > 0 && v <= 50)
    .map((v) => Math.round(v));

  const medYears = yearsData.length ? median(yearsData) : null;

  const buckets = [
    { label: "1–2 yr", min: 1, max: 3 },
    { label: "3–5 yr", min: 3, max: 6 },
    { label: "6–10 yr", min: 6, max: 11 },
    { label: "11–15 yr", min: 11, max: 16 },
    { label: "16–20 yr", min: 16, max: 21 },
    { label: "21–30 yr", min: 21, max: 31 },
    { label: "30+ yr", min: 31, max: Infinity },
  ];

  const histData = buckets.map(({ label, min, max }) => ({
    label,
    count: yearsData.filter((v) => v >= min && v < max).length,
  }));

  const medBucket = medYears !== null
    ? buckets.find((b) => medYears >= b.min && medYears < b.max)?.label
    : null;

  const pctToFIBuckets = [
    { label: "0–10%", min: 0, max: 10 },
    { label: "10–25%", min: 10, max: 25 },
    { label: "25–50%", min: 25, max: 50 },
    { label: "50–75%", min: 50, max: 75 },
    { label: "75–90%", min: 75, max: 90 },
    { label: "90–99%", min: 90, max: 100 },
  ];
  const pctToFIVals = pursuingRows
    .map((r) => r.pct_to_fi)
    .filter((v): v is number => v !== null && v >= 0 && v < 100);
  const pctToFIHist = pctToFIBuckets.map(({ label, min, max }) => ({
    label,
    count: pctToFIVals.filter((v) => v >= min && v < max).length,
  }));

  return (
    <section data-section id="years-to-fi">
      <SectionHeader
        number="07"
        eyebrow="The road ahead"
        title={
          medYears !== null
            ? `${Math.round(medYears)} years — the median time left for those still pursuing FI.`
            : "Most respondents are still a decade or more away."
        }
        lede={
          <>
            Estimated using reported assets, income, expenses, and FI target, with 7% real
            annual return assumed. {alreadyFIRows.length.toLocaleString()} respondents have already
            arrived and are excluded from this calculation.
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Years-to-FI histogram */}
        <div className="bg-white border border-[var(--slate-050)] rounded-xl p-6">
          <h3 className="text-[13px] font-medium text-foreground mb-1">
            Estimated years to FI
          </h3>
          <p className="text-[12px] text-[var(--slate-400)] mb-4">
            Non-FI respondents only · assumes 7% real annual return.
          </p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={histData} margin={{ top: 28, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray={CHART.gridlineDashed} stroke={CHART.gridline} vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: CHART.axisLabel }}
                axisLine={false}
                tickLine={false}
                angle={-35}
                textAnchor="end"
                interval={0}
                height={54}
              />
              <YAxis tick={{ fontSize: 11, fill: CHART.axisLabel }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(v) => [v, "respondents"]}
                contentStyle={{ fontSize: 12, borderColor: CHART.tooltipBorder, borderRadius: 8 }}
              />
              <Bar dataKey="count" fill={BRAND.green} radius={[3, 3, 0, 0]} maxBarSize={48} />
              {medBucket && (
                <ReferenceLine
                  x={medBucket}
                  stroke={BRAND.green}
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                  label={({ viewBox }) => (
                    <MedianPill
                      x={(viewBox as { x?: number })?.x}
                      y={(viewBox as { y?: number })?.y}
                      label={`MED ${Math.round(medYears!)} yr`}
                    />
                  )}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* % of way there histogram */}
        <div className="bg-white border border-[var(--slate-050)] rounded-xl p-6">
          <h3 className="text-[13px] font-medium text-foreground mb-1">
            % of FI target achieved
          </h3>
          <p className="text-[12px] text-[var(--slate-400)] mb-4">
            Self-reported — non-FI respondents only.
          </p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={pctToFIHist} margin={{ top: 8, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray={CHART.gridlineDashed} stroke={CHART.gridline} vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: CHART.axisLabel }}
                axisLine={false}
                tickLine={false}
                angle={-35}
                textAnchor="end"
                interval={0}
                height={54}
              />
              <YAxis tick={{ fontSize: 11, fill: CHART.axisLabel }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(v) => [v, "respondents"]}
                contentStyle={{ fontSize: 12, borderColor: CHART.tooltipBorder, borderRadius: 8 }}
              />
              <Bar dataKey="count" fill={BRAND.greenLight} radius={[3, 3, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Already-FI chip */}
      <div className="bg-white border border-[var(--slate-050)] rounded-xl p-6 flex items-center gap-6">
        <span className="rd-chip" style={{ fontSize: 14, padding: "8px 16px" }}>
          {alreadyFIRows.length.toLocaleString()} respondents already at FI
        </span>
        <p style={{ fontSize: 14, color: "var(--slate-600)", lineHeight: 1.55 }}>
          {Math.round((alreadyFIRows.length / Math.max(rows.length, 1)) * 100)}% of total respondents
          report they have already reached financial independence and are excluded from the
          time-to-FI calculation above.
        </p>
      </div>
    </section>
  );
}
