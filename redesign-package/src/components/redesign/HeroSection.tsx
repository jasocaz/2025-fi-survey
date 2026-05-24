"use client";
import type { SurveyResponse, Precomputed } from "@/lib/types";
import { median } from "@/lib/percentile";

interface Props {
  rows: SurveyResponse[];
  precomputed: Precomputed;
}

/** Split a dollar value into [number, suffix] for the big-number display.
 *  $1,580,000 -> ["1.58", "M"];  $850,000 -> ["850", "K"];  $42,000 -> ["42", "K"] */
function splitCompactDollar(n: number | null): [string, string] {
  if (n == null || !isFinite(n)) return ["—", ""];
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return [m >= 10 ? m.toFixed(1) : m.toFixed(2), "M"];
  }
  if (n >= 1_000) return [String(Math.round(n / 1_000)), "K"];
  return [String(Math.round(n)), ""];
}

export function HeroSection({ rows, precomputed }: Props) {
  const count = rows.length;
  const numFI = rows.filter((r) => r.is_fi).length;
  const pctFI = count ? Math.round((numFI / count) * 100) : 0;

  const nwValues = rows.map((r) => r.assets.total).filter((v): v is number => v !== null);
  const medianNW = median(nwValues);

  const fiNums = rows.map((r) => r.fi_number).filter((v): v is number => v !== null);
  const medianFI = median(fiNums);

  const [nwNum, nwSuffix] = splitCompactDollar(medianNW);
  const [fiNum, fiSuffix] = splitCompactDollar(medianFI);

  return (
    <section
      className="relative overflow-hidden text-white"
      style={{ background: "var(--gradient-mesh)" }}
    >
      <div className="max-w-7xl mx-auto px-6 pt-24 pb-20 relative z-10">
        {/* Eyebrow pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/14 backdrop-blur-sm mb-7 text-[12px] font-medium uppercase tracking-[0.10em]">
          <span
            className="w-1.5 h-1.5 rounded-full bg-white"
            style={{ boxShadow: "0 0 0 4px rgba(255,255,255,0.22)" }}
          />
          2025 Community Survey · r/financialindependence
        </div>

        {/* Title */}
        <h1 className="text-[40px] sm:text-[64px] lg:text-[88px] font-medium leading-[1.02] tracking-[-0.035em] max-w-[14ch] mb-6">
          A view of {precomputed.total.toLocaleString()} paths to financial independence.
        </h1>

        {/* Lede */}
        <p className="text-[17px] sm:text-[19px] lg:text-[21px] text-white/78 leading-[1.5] max-w-[60ch] mb-14">
          A self-reported snapshot of where this community stands — net worth, FI targets,
          expenses, allocation, and the {pctFI}% who say they&apos;re already there.
        </p>

        {/* KPI row */}
        <dl className="grid grid-cols-2 md:grid-cols-4 border-t border-b border-white/18 divide-y md:divide-y-0 md:divide-x divide-white/18">
          <Kpi value={count.toLocaleString()} sub={`${precomputed.completed.toLocaleString()} completed · ${(precomputed.total - precomputed.completed).toLocaleString()} partial`}>
            Responses
          </Kpi>
          <Kpi value={`$${nwNum}`} valueSuffix={nwSuffix} sub="Median household net worth across all respondents.">
            Median net worth
          </Kpi>
          <Kpi value={`$${fiNum}`} valueSuffix={fiSuffix} sub="The number this community is walking toward.">
            Median FI target
          </Kpi>
          <Kpi value={String(pctFI)} valueSuffix="%" sub={`${numFI.toLocaleString()} of ${count.toLocaleString()} respondents.`}>
            Already FI
          </Kpi>
        </dl>
      </div>
    </section>
  );
}

function Kpi({
  children,
  value,
  valueSuffix,
  sub,
}: {
  children: React.ReactNode;
  value: string;
  valueSuffix?: string;
  sub: string;
}) {
  return (
    <div className="py-7 px-0 md:px-7 md:first:pl-0 md:last:pr-0">
      <dt className="text-[11px] uppercase tracking-[0.10em] text-white/60 mb-3 font-medium">
        {children}
      </dt>
      <dd className="font-medium leading-none tracking-[-0.03em] numerics text-[clamp(34px,4vw,56px)]">
        {value}
        {valueSuffix && <span style={{ color: "#11EFE3" }}>{valueSuffix}</span>}
      </dd>
      <p className="mt-3.5 text-[13px] leading-[1.4] text-white/72 max-w-[22ch]">{sub}</p>
    </div>
  );
}
