"use client";
import { Card, CardContent } from "@/components/ui/card";
import { formatDollar } from "@/lib/percentile";
import type { SurveyResponse, Precomputed } from "@/lib/types";
import { median } from "@/lib/percentile";

interface Props {
  rows: SurveyResponse[];
  precomputed: Precomputed;
}

export function HeroSection({ rows, precomputed }: Props) {
  const count = rows.length;
  const numFI = rows.filter((r) => r.is_fi).length;
  const pctFI = count ? Math.round((numFI / count) * 100) : 0;

  const nwValues = rows.map((r) => r.assets.total).filter((v): v is number => v !== null);
  const medianNW = median(nwValues);

  const fiNums = rows.map((r) => r.fi_number).filter((v): v is number => v !== null);
  const medianFI = median(fiNums);

  const stats = [
    { label: "Respondents", value: count.toLocaleString(), sub: `${precomputed.completed} completed · ${precomputed.total - precomputed.completed} partial` },
    { label: "Median net worth", value: medianNW ? formatDollar(medianNW, true) : "—", sub: "all asset classes combined" },
    { label: "Median FI target", value: medianFI ? formatDollar(medianFI, true) : "—", sub: "the number they're aiming for" },
    { label: "Already FI", value: `${pctFI}%`, sub: `${numFI.toLocaleString()} of ${count.toLocaleString()} respondents`, accent: true },
  ];

  return (
    <section className="max-w-7xl mx-auto px-6 pt-10 pb-6">
      <p className="text-xs font-semibold tracking-widest text-stone-400 uppercase mb-2">
        2025 Annual Survey
      </p>
      <h1 className="font-serif text-4xl font-semibold text-stone-900 mb-2 leading-tight">
        2025 Survey Results for /r/financialindependence
      </h1>
      <p className="text-stone-500 mb-8 max-w-2xl">
        Self-reported data from {precomputed.total.toLocaleString()} community members on their finances,
        FIRE plans, and where they stand on the path to financial independence.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-0">
        {stats.map((s) => (
          <Card key={s.label} className="border-stone-200 shadow-none">
            <CardContent className="pt-5 pb-5">
              <p className="text-xs font-semibold tracking-widest text-stone-400 uppercase mb-2">{s.label}</p>
              <p className={`text-4xl font-bold font-mono tabular-nums ${s.accent ? "text-[#0a7d4a]" : "text-stone-900"}`}>
                {s.value}
              </p>
              <p className="text-xs text-stone-400 mt-1">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
