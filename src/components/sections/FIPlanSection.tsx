"use client";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Legend,
} from "recharts";
import type { SurveyResponse } from "@/lib/types";
import { FI_FLAVORS } from "@/lib/types";

const FLAVOR_COLORS: Record<string, string> = {
  "FI": "#0a7d4a",
  "ChubbyFI": "#5fb085",
  "Barista / Coast FI": "#b2dcc4",
  "FatFI": "#e0b84a",
  "LeanFI": "#c4503c",
  "Undecided": "#cccac0",
};

function SWRHistogram({ rows, visitorSWR }: { rows: SurveyResponse[]; visitorSWR?: number | null }) {
  const buckets: Record<string, number> = {};
  rows.forEach((r) => {
    const v = r.target_swr;
    if (!v || v < 1 || v > 5.5) return;
    const bucket = (Math.round(v * 2) / 2).toFixed(1);
    buckets[bucket] = (buckets[bucket] ?? 0) + 1;
  });
  const data = Object.entries(buckets)
    .map(([swr, count]) => ({ swr: parseFloat(swr), swrLabel: `${swr}%`, count }))
    .sort((a, b) => a.swr - b.swr);

  const visitorBucket = visitorSWR
    ? (Math.round(Math.max(1, Math.min(5.5, visitorSWR)) * 2) / 2).toFixed(1)
    : null;

  return (
    <ResponsiveContainer width="100%" height={190}>
      <BarChart data={data} margin={{ top: 20, right: 8, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0ede6" vertical={false} />
        <XAxis
          dataKey="swrLabel"
          tick={{ fontSize: 10, fill: "#78716c" }}
          axisLine={false}
          tickLine={false}
          interval={1}
        />
        <YAxis tick={{ fontSize: 10, fill: "#78716c" }} axisLine={false} tickLine={false} width={28} />
        <Tooltip formatter={(v) => [v, "respondents"]} contentStyle={{ fontSize: 12, borderColor: "#e6e3d9" }} />
        <Bar dataKey="count" fill="#0a7d4a" radius={[3, 3, 0, 0]} />
        <ReferenceLine x="4.0%" stroke="#c4503c" strokeWidth={2} strokeDasharray="4 2"
          label={{ value: "4% rule", position: "top", fontSize: 9, fill: "#c4503c", fontWeight: 700 }} />
        {visitorBucket && (
          <ReferenceLine x={`${visitorBucket}%`} stroke="#0a5530" strokeWidth={2}
            label={{ value: "▲ you", position: "top", fontSize: 9, fill: "#0a5530", fontWeight: 700 }} />
        )}
      </BarChart>
    </ResponsiveContainer>
  );
}

function SupplementChart({ rows }: { rows: SurveyResponse[] }) {
  const sources = [
    { label: "Social Security", key: "supp_gov" as const },
    { label: "Inheritance", key: "supp_inheritance" as const },
    { label: "Employer pension", key: "supp_pension" as const },
    { label: "Rental income", key: "supp_rental" as const },
  ];
  const timings = ["Prior to retirement", "Immediately on retirement", "At some point after retirement"] as const;
  const timingColors = ["#0a5530","#0a7d4a","#b2dcc4"];

  const data = sources.map(({ label, key }) => {
    const counts: Record<string, number> = {};
    rows.forEach((r) => {
      const v = r[key];
      if (!v || v === "N/A") return;
      if (v.includes("Prior")) counts["Prior"] = (counts["Prior"] ?? 0) + 1;
      if (v.includes("Immediately")) counts["Immediately"] = (counts["Immediately"] ?? 0) + 1;
      if (v.includes("At some point")) counts["After"] = (counts["After"] ?? 0) + 1;
    });
    return { label, ...counts };
  });

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 20, left: 100, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0ede6" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 10, fill: "#78716c" }} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="label" tick={{ fontSize: 11, fill: "#44403c" }} axisLine={false} tickLine={false} width={100} />
        <Tooltip contentStyle={{ fontSize: 12, borderColor: "#e6e3d9" }} />
        <Legend wrapperStyle={{ fontSize: 10 }} />
        {["Prior","Immediately","After"].map((t, i) => (
          <Bar key={t} dataKey={t} name={timings[i]} stackId="a" fill={timingColors[i]} maxBarSize={24} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function FIPlanSection({ rows, visitorFINumber, visitorSWR }: {
  rows: SurveyResponse[];
  visitorFINumber?: number | null;
  visitorSWR?: number | null;
}) {
  const n = rows.length;

  const flavorData = FI_FLAVORS.map((f) => ({
    name: f.replace(" / Coast FI",""),
    value: rows.filter((r) => r.fi_flavor === f).length,
  })).filter((d) => d.value > 0);

  const stopWorkingData = (() => {
    const opts = ["Yes","Partially","No","Undecided"];
    return opts.map((o) => ({ name: o, value: rows.filter((r) => r.stop_working_at_fi === o).length })).filter((d) => d.value > 0);
  })();

  const STOP_COLORS = ["#0a7d4a","#5fb085","#c4503c","#cccac0"];

  const retireAgeData = (() => {
    const brackets = ["31-35","36-40","41-45","46-50","51-55","56-60","61-65","66-70","71+","Undecided"];
    return brackets.map((b) => ({
      bracket: b,
      count: rows.filter((r) => r.target_retire_age_bracket === b).length,
    })).filter((d) => d.count > 0);
  })();

  return (
    <section className="max-w-7xl mx-auto px-6 py-8 border-t border-stone-100">
      <p className="text-xs font-semibold tracking-widest text-stone-500 uppercase mb-1">§04</p>
      <h2 className="font-serif text-3xl font-semibold text-stone-900 mb-6">The FI plan</h2>

      {/* 4-chart grid — breaks 1→2→4 columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* 1. FI flavor donut */}
        <div>
          <h3 className="text-sm font-semibold text-stone-700 mb-3">FI flavor</h3>
          <div className="flex flex-col items-center">
            <PieChart width={160} height={160}>
              <Pie data={flavorData} cx={75} cy={75} innerRadius={44} outerRadius={72} paddingAngle={1} dataKey="value">
                {flavorData.map((d) => (
                  <Cell key={d.name} fill={FLAVOR_COLORS[d.name] ?? FLAVOR_COLORS["FI"]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => [`${v} (${Math.round(Number(v)/n*100)}%)`, ""]} contentStyle={{ fontSize: 12, borderColor: "#e6e3d9" }} />
            </PieChart>
            <ul className="text-xs space-y-1 mt-2 self-start">
              {flavorData.map((d) => (
                <li key={d.name} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: FLAVOR_COLORS[d.name] ?? "#aaa" }} />
                  <span className="text-stone-600">{d.name}</span>
                  <span className="font-mono text-stone-500">{Math.round(d.value/n*100)}%</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 2. Stop working donut */}
        <div>
          <h3 className="text-sm font-semibold text-stone-700 mb-3">Stop working at FI?</h3>
          <div className="flex flex-col items-center">
            <PieChart width={160} height={160}>
              <Pie data={stopWorkingData} cx={75} cy={75} innerRadius={44} outerRadius={72} paddingAngle={1} dataKey="value">
                {stopWorkingData.map((_, i) => <Cell key={i} fill={STOP_COLORS[i]} />)}
              </Pie>
              <Tooltip formatter={(v) => [`${v} (${Math.round(Number(v)/n*100)}%)`, ""]} contentStyle={{ fontSize: 12, borderColor: "#e6e3d9" }} />
            </PieChart>
            <ul className="text-xs space-y-1 mt-2 self-start">
              {stopWorkingData.map((d, i) => (
                <li key={d.name} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: STOP_COLORS[i] }} />
                  <span className="text-stone-600">{d.name}</span>
                  <span className="font-mono text-stone-500">{Math.round(d.value/n*100)}%</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 3. Target retire age */}
        <div>
          <h3 className="text-sm font-semibold text-stone-700 mb-3">Target retirement age</h3>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={retireAgeData} margin={{ top: 0, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ede6" vertical={false} />
              <XAxis dataKey="bracket" tick={{ fontSize: 8, fill: "#78716c" }} axisLine={false} tickLine={false} angle={-35} textAnchor="end" height={36} />
              <YAxis tick={{ fontSize: 10, fill: "#78716c" }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => [v, "respondents"]} contentStyle={{ fontSize: 12, borderColor: "#e6e3d9" }} />
              <Bar dataKey="count" fill="#0a7d4a" radius={[3, 3, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 4. SWR histogram */}
        <div>
          <h3 className="text-sm font-semibold text-stone-700 mb-1">Target safe withdrawal rate</h3>
          <p className="text-xs text-stone-400 mb-2">4% rule (red) remains dominant; cluster shifting toward 3–3.5%.</p>
          <SWRHistogram rows={rows} visitorSWR={visitorSWR} />
        </div>
      </div>

      {/* Supplement plan — full width */}
      <div>
        <h3 className="text-sm font-semibold text-stone-700 mb-1">What&apos;s the supplement plan?</h3>
        <p className="text-xs text-stone-400 mb-3">
          ~30% expect an inheritance at some point. Social Security is expected by the majority but mostly &ldquo;eventually.&rdquo;
        </p>
        <SupplementChart rows={rows} />
      </div>
    </section>
  );
}
