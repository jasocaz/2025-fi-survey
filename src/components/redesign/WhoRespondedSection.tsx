"use client";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { SurveyResponse } from "@/lib/types";
import { SectionHeader } from "./SectionHeader";
import { CHART, CATEGORICAL, BRAND } from "@/lib/redesign/theme";

function countBy<K extends string>(
  rows: SurveyResponse[],
  key: (r: SurveyResponse) => K | null,
): Array<{ name: K; value: number }> {
  const m = new Map<K, number>();
  rows.forEach((r) => {
    const k = key(r);
    if (k) m.set(k, (m.get(k) ?? 0) + 1);
  });
  return Array.from(m.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

const CHIP = "px-3 py-1 text-[11px] font-mono numerics rounded-full bg-[var(--slate-025)] text-[var(--slate-600)] border border-[var(--slate-050)]";

function MiniLabel({ children }: { children: React.ReactNode }) {
  return <h3 className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--slate-500)] mb-3">{children}</h3>;
}

interface MiniDonutProps {
  data: { name: string; value: number }[];
  total: number;
  colors?: readonly string[];
}
function MiniDonut({ data, total, colors = CATEGORICAL }: MiniDonutProps) {
  return (
    <div className="flex items-center gap-4">
      <PieChart width={100} height={100}>
        <Pie data={data} cx={45} cy={45} innerRadius={28} outerRadius={45} paddingAngle={1} dataKey="value">
          {data.map((_, i) => (
            <Cell key={i} fill={colors[i % colors.length]} />
          ))}
        </Pie>
      </PieChart>
      <ul className="text-xs space-y-1">
        {data.slice(0, 5).map((d, i) => (
          <li key={d.name} className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full inline-block flex-shrink-0"
              style={{ background: colors[i % colors.length] }}
            />
            <span className="text-[var(--slate-600)]">{d.name}</span>
            <span className="font-mono numerics text-[var(--slate-400)]">
              {Math.round((d.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function WhoRespondedSection({ rows }: { rows: SurveyResponse[] }) {
  const n = rows.length;

  const genderData = countBy(rows, (r) => r.gender as string | null);
  const housingData = countBy(rows, (r) => {
    const h = r.housing;
    if (!h) return null;
    if (h === "Own") return "Own";
    if (h === "Rent") return "Rent";
    if (h.includes("family") || h.includes("friends")) return "With family";
    return "Other";
  });
  const eduData = countBy(rows, (r) => {
    const e = r.education;
    if (!e) return null;
    if (e.includes("Bachelor")) return "Bachelor's";
    if (e.includes("Master")) return "Master's";
    if (e.includes("Doctorate")) return "Doctorate";
    if (e.includes("Associate")) return "Associate's";
    return "Other";
  });

  const ageData = (() => {
    const brackets = ["21-25", "26-30", "31-35", "36-40", "41-45", "46-50", "51-55", "56-60", "61+"];
    return brackets
      .map((b) => ({
        bracket: b,
        count: rows.filter(
          (r) => r.age_bracket === b || (b === "61+" && r.age_bracket && r.age_bracket >= "61"),
        ).length,
      }))
      .filter((d) => d.count > 0);
  })();

  const industryData = countBy(rows, (r) => {
    const ind = r.industry;
    if (!ind) return null;
    if (ind.includes("Information Technology")) return "Software / IT";
    if (ind.includes("Engineering")) return "Engineering";
    if (ind.includes("Healthcare")) return "Healthcare";
    if (ind.includes("Financial")) return "Finance";
    if (ind.includes("Manufacturing")) return "Manufacturing";
    if (ind.includes("Education")) return "Education";
    if (ind.includes("Professional")) return "Business Svcs";
    if (ind.includes("Public Administration")) return "Government";
    if (ind.includes("Energy")) return "Energy";
    if (ind.includes("Military")) return "Military";
    return "Other";
  }).slice(0, 9);

  const regionSummary = (() => {
    const regions: Record<string, number> = { US: 0, Canada: 0, Europe: 0, "APAC+Other": 0 };
    rows.forEach((r) => {
      if (r.region === "US") regions["US"]++;
      else if (r.region === "CA") regions["Canada"]++;
      else if (r.region === "EU") regions["Europe"]++;
      else regions["APAC+Other"]++;
    });
    return regions;
  })();

  return (
    <section data-section id="who">
      <SectionHeader
        number="01"
        eyebrow="Who responded"
        title="A skew that's worth saying out loud."
        lede={
          <>
            Respondents are largely US-based, high-earning, and mid-career. The community's
            composition shapes every other number on this page.
          </>
        }
      />

      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-12 p-7 rounded-xl border border-[var(--slate-050)]"
      >
        {/* Age */}
        <div>
          <MiniLabel>Age distribution</MiniLabel>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={ageData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray={CHART.gridlineDashed} stroke={CHART.gridline} vertical={false} />
              <XAxis dataKey="bracket" tick={{ fontSize: 12, fill: CHART.axisLabel }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: CHART.axisLabel }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(v) => [v, "respondents"]}
                contentStyle={{ fontSize: 12, borderColor: CHART.tooltipBorder, borderRadius: 8 }}
              />
              <Bar dataKey="count" fill={BRAND.green} radius={[3, 3, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gender */}
        <div>
          <MiniLabel>Gender</MiniLabel>
          <MiniDonut data={genderData} total={n} />
        </div>

        {/* Housing */}
        <div>
          <MiniLabel>Housing tenure</MiniLabel>
          <MiniDonut data={housingData} total={n} />
        </div>

        {/* Industry — full width */}
        <div className="sm:col-span-2 lg:col-span-3">
          <MiniLabel>Industry (top 9)</MiniLabel>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={industryData} layout="vertical" margin={{ top: 0, right: 20, left: 80, bottom: 0 }}>
              <CartesianGrid strokeDasharray={CHART.gridlineDashed} stroke={CHART.gridline} horizontal={false} />
              <XAxis type="number" domain={[0, 'dataMax']} tick={{ fontSize: 12, fill: CHART.axisLabel }} axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 12, fill: CHART.axisTitle }}
                axisLine={false}
                tickLine={false}
                width={80}
              />
              <Tooltip
                formatter={(v) => [`${v} (${Math.round((Number(v) / n) * 100)}%)`, "respondents"]}
                contentStyle={{ fontSize: 12, borderColor: CHART.tooltipBorder, borderRadius: 8 }}
              />
              <Bar dataKey="value" fill={BRAND.green} radius={[0, 3, 3, 0]} maxBarSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Education */}
        <div>
          <MiniLabel>Education</MiniLabel>
          <MiniDonut data={eduData} total={n} />
        </div>

        {/* Region chips */}
        <div className="sm:col-span-2">
          <MiniLabel>Region (estimated from currency)</MiniLabel>
          <div className="flex flex-wrap gap-2">
            {Object.entries(regionSummary).map(([region, count]) => (
              <span key={region} className={CHIP}>
                {region} · {count}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
