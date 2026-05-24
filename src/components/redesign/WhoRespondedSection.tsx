"use client";
import type { SurveyResponse } from "@/lib/types";
import { SectionHeader } from "./SectionHeader";

function countBy<K extends string>(
  rows: SurveyResponse[],
  key: (r: SurveyResponse) => K | null,
): Array<{ name: K; count: number }> {
  const m = new Map<K, number>();
  rows.forEach((r) => {
    const k = key(r);
    if (k) m.set(k, (m.get(k) ?? 0) + 1);
  });
  return Array.from(m.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

interface HBarCardProps {
  title: string;
  rows: { label: string; count: number }[];
  total: number;
}
function HBarCard({ title, rows, total }: HBarCardProps) {
  const maxCount = Math.max(...rows.map((d) => d.count), 1);
  return (
    <div className="rd-card">
      <h3
        style={{
          fontSize: 13,
          fontWeight: 500,
          color: "var(--navy)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: 16,
        }}
      >
        {title}
      </h3>
      {rows.map((d) => (
        <div key={d.label} className="hbar">
          <span className="lbl">{d.label}</span>
          <div className="track">
            <div className="fill" style={{ width: `${(d.count / maxCount) * 100}%` }} />
          </div>
          <span className="val">{Math.round((d.count / total) * 100)}%</span>
        </div>
      ))}
    </div>
  );
}

export function WhoRespondedSection({ rows }: { rows: SurveyResponse[] }) {
  const n = rows.length;

  const ageBrackets = ["21-25", "26-30", "31-35", "36-40", "41-45", "46-50", "51-55", "56-60", "61+"];
  const ageData = ageBrackets
    .map((b) => ({
      label: b,
      count: rows.filter((r) => r.age_bracket === b).length,
    }))
    .filter((d) => d.count > 0);

  const incBuckets: Array<{ label: string; test: (v: number) => boolean }> = [
    { label: "< $50k", test: (v) => v < 50_000 },
    { label: "$50k – $100k", test: (v) => v >= 50_000 && v < 100_000 },
    { label: "$100k – $150k", test: (v) => v >= 100_000 && v < 150_000 },
    { label: "$150k – $200k", test: (v) => v >= 150_000 && v < 200_000 },
    { label: "$200k – $300k", test: (v) => v >= 200_000 && v < 300_000 },
    { label: "$300k+", test: (v) => v >= 300_000 },
  ];
  const incData = incBuckets
    .map(({ label, test }) => ({
      label,
      count: rows.filter((r) => r.income.total !== null && test(r.income.total as number)).length,
    }))
    .filter((d) => d.count > 0);

  const industryData = countBy(rows, (r) => {
    const ind = r.industry;
    if (!ind) return null;
    if (ind.includes("Information Technology")) return "Software / IT";
    if (ind.includes("Engineering")) return "Engineering";
    if (ind.includes("Healthcare")) return "Healthcare";
    if (ind.includes("Financial")) return "Finance";
    if (ind.includes("Education")) return "Education";
    if (ind.includes("Professional")) return "Business Svcs";
    if (ind.includes("Public Administration")) return "Government";
    return "Other";
  })
    .slice(0, 6)
    .map((d) => ({ label: d.name, count: d.count }));

  const geoData = [
    { label: "United States", count: rows.filter((r) => r.region === "US").length },
    { label: "Canada", count: rows.filter((r) => r.region === "CA").length },
    { label: "Europe", count: rows.filter((r) => r.region === "EU").length },
    {
      label: "APAC / Other",
      count: rows.filter((r) => !["US", "CA", "EU"].includes(r.region ?? "")).length,
    },
  ].filter((d) => d.count > 0);

  return (
    <section data-section id="demographics">
      <SectionHeader
        number="02"
        eyebrow="Who responded"
        title="A skew that's worth saying out loud."
        lede={
          <>
            Respondents are largely US-based, high-earning, and mid-career. The community&apos;s
            composition shapes every other number on this page.
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <HBarCard title="Age distribution" rows={ageData} total={n} />
        <HBarCard title="Household income" rows={incData} total={n} />
        <HBarCard title="Occupation" rows={industryData} total={n} />
        <HBarCard title="Geography" rows={geoData} total={n} />
      </div>
    </section>
  );
}
