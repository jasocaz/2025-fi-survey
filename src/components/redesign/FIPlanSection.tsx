"use client";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { SurveyResponse } from "@/lib/types";
import { FI_FLAVORS } from "@/lib/types";
import { SectionHeader } from "./SectionHeader";
import { CHART, BRAND, FLAVOR_COLORS } from "@/lib/redesign/theme";
import { median } from "@/lib/percentile";

const TIMING_COLORS = [BRAND.greenDeep, BRAND.green, "#A9E4C7"];
const STOP_COLORS = [BRAND.green, BRAND.greenLight, "#FF8A65", "#ADBDCC"];

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

  const swrVals = rows.map((r) => r.target_swr).filter((v): v is number => v !== null && v >= 1 && v <= 5.5);
  const medSWR = swrVals.length ? median(swrVals) : null;
  const medBin = medSWR !== null ? `${(Math.round(medSWR * 2) / 2).toFixed(1)}%` : null;

  const visitorBucket = visitorSWR
    ? (Math.round(Math.max(1, Math.min(5.5, visitorSWR)) * 2) / 2).toFixed(1)
    : null;

  return (
    <ResponsiveContainer width="100%" height={190}>
      <BarChart data={data} margin={{ top: 28, right: 8, left: 4, bottom: 0 }}>
        <CartesianGrid strokeDasharray={CHART.gridlineDashed} stroke={CHART.gridline} vertical={false} />
        <XAxis
          dataKey="swrLabel"
          tick={{ fontSize: 12, fill: CHART.axisLabel }}
          axisLine={false}
          tickLine={false}
          interval={1}
        />
        <YAxis tick={{ fontSize: 12, fill: CHART.axisLabel }} axisLine={false} tickLine={false} width={40} />
        <Tooltip
          formatter={(v) => [v, "respondents"]}
          contentStyle={{ fontSize: 12, borderColor: CHART.tooltipBorder, borderRadius: 8 }}
        />
        <Bar dataKey="count" fill={BRAND.green} radius={[3, 3, 0, 0]} />
        {medBin && (
          <ReferenceLine
            x={medBin}
            stroke={BRAND.green}
            strokeWidth={1.5}
            strokeDasharray="3 3"
            ifOverflow="extendDomain"
            label={({ viewBox }) => (
              <MedianPill x={(viewBox as { x?: number })?.x} y={(viewBox as { y?: number })?.y} label={`MEDIAN ${medSWR?.toFixed(1)}%`} />
            )}
          />
        )}
        <ReferenceLine
          x="4.0%"
          stroke="#FF8A65"
          strokeWidth={2}
          strokeDasharray="4 2"
          label={{ value: "4% rule", position: "insideTopRight", fontSize: 9, fill: "#C75032", fontWeight: 700 }}
        />
        {visitorBucket && (
          <ReferenceLine
            x={`${visitorBucket}%`}
            stroke={BRAND.greenDark}
            strokeWidth={2}
            label={{ value: "▲ you", position: "top", fontSize: 9, fill: BRAND.greenDark, fontWeight: 700 }}
          />
        )}
      </BarChart>
    </ResponsiveContainer>
  );
}

function SupplementChart({ rows }: { rows: SurveyResponse[] }) {
  const sources = [
    { label: "Social Sec.", key: "supp_gov" as const },
    { label: "Inherit.", key: "supp_inheritance" as const },
    { label: "Pension", key: "supp_pension" as const },
    { label: "Rental", key: "supp_rental" as const },
  ];
  const timings = [
    "Prior to retirement",
    "Immediately on retirement",
    "At some point after retirement",
  ] as const;

  const data = sources.map(({ label, key }) => {
    const counts: Record<string, number> = { Prior: 0, Immediately: 0, After: 0 };
    rows.forEach((r) => {
      const v = r[key];
      if (!v || v === "N/A") return;
      if (v.includes("Prior")) counts.Prior += 1;
      if (v.includes("Immediately")) counts.Immediately += 1;
      if (v.includes("At some point")) counts.After += 1;
    });
    return { label, ...counts };
  });

  return (
    <ResponsiveContainer width="100%" height={190}>
      <BarChart data={data} margin={{ top: 0, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray={CHART.gridlineDashed} stroke={CHART.gridline} vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: CHART.axisLabel }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis tick={{ fontSize: 11, fill: CHART.axisLabel }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ fontSize: 11, borderColor: CHART.tooltipBorder, borderRadius: 8 }}
          formatter={(v, name) => {
            const i = name === "Prior" ? 0 : name === "Immediately" ? 1 : 2;
            return [v, timings[i]];
          }}
        />
        {(["Prior", "Immediately", "After"] as const).map((t, i) => (
          <Bar key={t} dataKey={t} stackId="a" fill={TIMING_COLORS[i]} maxBarSize={36} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function FIPlanSection({
  rows,
}: {
  rows: SurveyResponse[];
  visitorFINumber?: number | null;
}) {
  const visitorSWR: number | null = null;
  const n = rows.length;

  const fiNums = rows.map((r) => r.fi_number).filter((v): v is number => v !== null);
  const medFI = fiNums.length ? median(fiNums) : null;
  const medFIFmt = medFI !== null
    ? medFI >= 1_000_000
      ? `$${(medFI / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`
      : `$${Math.round(medFI / 1000)}k`
    : "$2.5M";

  const swrVals = rows.map((r) => r.target_swr).filter((v): v is number => v !== null && v >= 1 && v <= 5.5);
  const medSWR = swrVals.length ? median(swrVals) : null;

  const flavorData = FI_FLAVORS.map((f) => ({
    name: f.replace(" / Coast FI", ""),
    value: rows.filter((r) => r.fi_flavor === f).length,
  })).filter((d) => d.value > 0);

  const stopWorkingData = (() => {
    const opts = ["Yes", "Partially", "No", "Undecided"];
    return opts
      .map((o) => ({ name: o, value: rows.filter((r) => r.stop_working_at_fi === o).length }))
      .filter((d) => d.value > 0);
  })();

  const retireAgeData = (() => {
    const brackets = [
      "31-35",
      "36-40",
      "41-45",
      "46-50",
      "51-55",
      "56-60",
      "61-65",
      "66-70",
      "71+",
      "Undecided",
    ];
    return brackets
      .map((b) => ({
        bracket: b,
        count: rows.filter((r) => r.target_retire_age_bracket === b).length,
      }))
      .filter((d) => d.count > 0);
  })();

  const moduleClass = "bg-white border border-[var(--slate-050)] rounded-xl p-6";

  return (
    <section data-section data-alt="true" id="fi-plan">
      <div>
        <SectionHeader
          number="04"
          eyebrow="Where they're going"
          title={`${medFIFmt} is the number the community is walking toward.`}
          lede={
            <>
              Most respondents are pursuing standard FI; ChubbyFI is the largest stretch goal. The
              community largely anchors to the 4% rule, with a sizable conservative cluster
              targeting 3–3.5%.
            </>
          }
        />

        {/* Big number card — median target SWR */}
        {medSWR !== null && (
          <div className="grid grid-cols-1 md:grid-cols-[0.6fr_1.4fr] gap-5 mb-5">
            <div
              className="p-8 rounded-xl text-white flex flex-col justify-between"
              style={{ background: "var(--gradient-navy)" }}
            >
              <div>
                <p className="text-[11px] uppercase tracking-[0.10em] text-white/70 mb-3 font-medium">
                  Median target SWR
                </p>
                <div className="font-light leading-[0.95] tracking-[-0.035em] text-[clamp(56px,7vw,96px)] numerics">
                  {medSWR.toFixed(1)}
                  <span className="text-[0.45em] text-white/60 ml-1 font-normal">%</span>
                </div>
              </div>
              <p className="text-sm text-white/75 mt-6 leading-[1.55]">
                The median plan lands right at the 4% rule, but the distribution&apos;s second
                peak sits at 3–3.5%, reflecting awareness of sequence-of-returns risk.
              </p>
              <div className="mt-6 pt-5 border-t border-white/15">
                <div className="text-[11px] uppercase tracking-[0.08em] text-white/55 mb-1">Median FI target</div>
                <div className="text-2xl font-medium font-mono numerics">{medFIFmt}</div>
              </div>
            </div>
            <div className={moduleClass}>
              <h3 className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--slate-500)] mb-1">
                Target safe withdrawal rate
              </h3>
              <p className="text-[11px] text-[var(--slate-400)] mb-2">Mode at 4%, with a conservative secondary cluster at 3.0–3.5%.</p>
              <SWRHistogram rows={rows} visitorSWR={visitorSWR} />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
          {/* 1. FI flavor donut */}
          <div className={moduleClass}>
            <h3 className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--slate-500)] mb-3">FI flavor</h3>
            <div className="flex flex-col items-center">
              <PieChart width={160} height={160}>
                <Pie data={flavorData} cx={75} cy={75} innerRadius={44} outerRadius={72} paddingAngle={1} dataKey="value">
                  {flavorData.map((d) => (
                    <Cell key={d.name} fill={FLAVOR_COLORS[d.name] ?? FLAVOR_COLORS.FI} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v) => [`${v} (${Math.round((Number(v) / n) * 100)}%)`, ""]}
                  contentStyle={{ fontSize: 12, borderColor: CHART.tooltipBorder, borderRadius: 8 }}
                />
              </PieChart>
              <ul className="text-xs space-y-1 mt-2 self-start">
                {flavorData.map((d) => (
                  <li key={d.name} className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: FLAVOR_COLORS[d.name] ?? "#aaa" }}
                    />
                    <span className="text-[var(--slate-600)]">{d.name}</span>
                    <span className="font-mono numerics text-[var(--slate-500)]">
                      {Math.round((d.value / n) * 100)}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 2. Stop working donut */}
          <div className={moduleClass}>
            <h3 className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--slate-500)] mb-3">
              Stop working at FI?
            </h3>
            <div className="flex flex-col items-center">
              <PieChart width={160} height={160}>
                <Pie data={stopWorkingData} cx={75} cy={75} innerRadius={44} outerRadius={72} paddingAngle={1} dataKey="value">
                  {stopWorkingData.map((_, i) => (
                    <Cell key={i} fill={STOP_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v) => [`${v} (${Math.round((Number(v) / n) * 100)}%)`, ""]}
                  contentStyle={{ fontSize: 12, borderColor: CHART.tooltipBorder, borderRadius: 8 }}
                />
              </PieChart>
              <ul className="text-xs space-y-1 mt-2 self-start">
                {stopWorkingData.map((d, i) => (
                  <li key={d.name} className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: STOP_COLORS[i] }}
                    />
                    <span className="text-[var(--slate-600)]">{d.name}</span>
                    <span className="font-mono numerics text-[var(--slate-500)]">
                      {Math.round((d.value / n) * 100)}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 3. Target retire age */}
          <div className={moduleClass}>
            <h3 className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--slate-500)] mb-3">
              Target retirement age
            </h3>
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={retireAgeData} margin={{ top: 0, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray={CHART.gridlineDashed} stroke={CHART.gridline} vertical={false} />
                <XAxis
                  dataKey="bracket"
                  tick={{ fontSize: 9, fill: CHART.axisLabel }}
                  axisLine={false}
                  tickLine={false}
                  angle={-35}
                  textAnchor="end"
                  height={36}
                />
                <YAxis tick={{ fontSize: 12, fill: CHART.axisLabel }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(v) => [v, "respondents"]}
                  contentStyle={{ fontSize: 12, borderColor: CHART.tooltipBorder, borderRadius: 8 }}
                />
                <Bar dataKey="count" fill={BRAND.green} radius={[3, 3, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 4. Supplement plan (vertical) */}
          <div className={moduleClass}>
            <h3 className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--slate-500)] mb-1">
              Supplement plan
            </h3>
            <p className="text-[11px] text-[var(--slate-400)] mb-3">
              Social Security expected by most, mostly “eventually.”
            </p>
            <SupplementChart rows={rows} />
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[10px] text-[var(--slate-500)]">
              {[
                { c: TIMING_COLORS[0], l: "Prior" },
                { c: TIMING_COLORS[1], l: "Immediate" },
                { c: TIMING_COLORS[2], l: "Later" },
              ].map((s) => (
                <span key={s.l} className="inline-flex items-center gap-1.5">
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: s.c, display: "inline-block" }} />
                  {s.l}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
