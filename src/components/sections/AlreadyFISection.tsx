"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, PieChart, Pie, Cell } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { formatDollar, median, percentileValue } from "@/lib/percentile";
import type { SurveyResponse } from "@/lib/types";

export function AlreadyFISection({ rows }: { rows: SurveyResponse[] }) {
  const fiRows = rows.filter((r) => r.is_fi);
  const reRows = rows.filter((r) => r.is_re);
  const n = fiRows.length;
  if (n === 0) return null;

  // Median NW for FI vs non-FI
  const fiNW = fiRows.map((r) => r.assets.total).filter((v): v is number => v !== null);
  const nonFiNW = rows.filter((r) => !r.is_fi).map((r) => r.assets.total).filter((v): v is number => v !== null);
  const medFiNW = median(fiNW);
  const medNonFiNW = median(nonFiNW);

  // Actual SWR distribution
  const swrVals = reRows.map((r) => r.actual_swr).filter((v): v is number => v !== null && v > 0 && v <= 15);
  const swrBuckets: Record<string, number> = {};
  swrVals.forEach((v) => {
    const b = (Math.round(v * 2) / 2).toFixed(1);
    swrBuckets[b] = (swrBuckets[b] ?? 0) + 1;
  });
  const swrData = Object.entries(swrBuckets)
    .map(([swr, count]) => ({ swr: `${swr}%`, count }))
    .sort((a, b) => parseFloat(a.swr) - parseFloat(b.swr));

  // Actual vs target SWR
  const targetSWRs = fiRows.map((r) => r.target_swr).filter((v): v is number => v !== null && v > 0 && v <= 10);
  const medTargetSWR = median(targetSWRs);
  const medActualSWR = median(swrVals);

  // Withdrawal vs plan
  const wdData = [
    { name: "Less than planned", value: reRows.filter((r) => r.withdrawal_vs_plan === "less").length, color: "#0a7d4a" },
    { name: "About right", value: reRows.filter((r) => r.withdrawal_vs_plan === "right").length, color: "#5fb085" },
    { name: "More than planned", value: reRows.filter((r) => r.withdrawal_vs_plan === "more").length, color: "#c4503c" },
  ].filter((d) => d.value > 0);

  return (
    <section className="max-w-7xl mx-auto px-6 py-8 border-t border-stone-100">
      <p className="text-xs font-semibold tracking-widest text-stone-600 uppercase mb-1">§07</p>
      <h2 className="font-serif text-3xl font-semibold text-stone-900 mb-2">The already-FI cohort</h2>
      <p className="text-stone-500 mb-8 text-sm">
        {n} respondents say they&apos;re financially independent · {reRows.length} say they&apos;re retired.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="border-stone-200 shadow-none">
          <CardContent className="pt-5">
            <p className="text-xs font-semibold tracking-wider uppercase text-stone-600 mb-2">Median NW (FI)</p>
            <p className="text-3xl font-bold font-mono text-[#0a7d4a]">{medFiNW ? formatDollar(medFiNW, true) : "—"}</p>
          </CardContent>
        </Card>
        <Card className="border-stone-200 shadow-none">
          <CardContent className="pt-5">
            <p className="text-xs font-semibold tracking-wider uppercase text-stone-600 mb-2">Median NW (pursuing)</p>
            <p className="text-3xl font-bold font-mono text-stone-700">{medNonFiNW ? formatDollar(medNonFiNW, true) : "—"}</p>
          </CardContent>
        </Card>
        <Card className="border-stone-200 shadow-none">
          <CardContent className="pt-5">
            <p className="text-xs font-semibold tracking-wider uppercase text-stone-600 mb-2">Median target SWR</p>
            <p className="text-3xl font-bold font-mono text-stone-700">{medTargetSWR ? `${medTargetSWR.toFixed(2)}%` : "—"}</p>
          </CardContent>
        </Card>
        <Card className="border-stone-200 shadow-none">
          <CardContent className="pt-5">
            <p className="text-xs font-semibold tracking-wider uppercase text-stone-600 mb-2">Median actual SWR</p>
            <p className="text-3xl font-bold font-mono text-[#0a7d4a]">{medActualSWR ? `${medActualSWR.toFixed(2)}%` : "—"}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Actual SWR distribution */}
        <div>
          <h3 className="text-sm font-semibold text-stone-700 mb-1">Actual withdrawal rate (retirees)</h3>
          <p className="text-xs text-stone-400 mb-3">Median retiree SWR is 2.8% — partly because half of retired respondents are under 45 and pacing for a long horizon.</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={swrData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ede6" vertical={false} />
              <XAxis dataKey="swr" tick={{ fontSize: 10, fill: "#78716c" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#78716c" }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => [v, "retirees"]} contentStyle={{ fontSize: 12, borderColor: "#e6e3d9" }} />
              <Bar dataKey="count" fill="#0a7d4a" radius={[3, 3, 0, 0]} maxBarSize={28} />
              <ReferenceLine x="4.0%" stroke="#c4503c" strokeWidth={2} strokeDasharray="4 2"
                label={{ value: "4%", position: "top", fontSize: 10, fill: "#c4503c", fontWeight: 700 }} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Withdrawing more/less/right */}
        <div>
          <h3 className="text-sm font-semibold text-stone-700 mb-1">Spending vs plan</h3>
          <p className="text-xs text-stone-400 mb-3">Retirees are overwhelmingly underspending their plan right now — this is likely a combination of age-associated caution (younger retirees need their money to last longer) and current market performance.</p>
          <div className="flex items-center gap-6 mt-8">
            <PieChart width={160} height={160}>
              <Pie data={wdData} cx={75} cy={75} innerRadius={45} outerRadius={72} paddingAngle={2} dataKey="value">
                {wdData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip formatter={(v) => [v, "retirees"]} contentStyle={{ fontSize: 12, borderColor: "#e6e3d9" }} />
            </PieChart>
            <ul className="text-sm space-y-2">
              {wdData.map((d) => (
                <li key={d.name} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ background: d.color }} />
                  <span className="text-stone-600">{d.name}</span>
                  <span className="font-mono font-semibold text-stone-800 ml-1">{d.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
