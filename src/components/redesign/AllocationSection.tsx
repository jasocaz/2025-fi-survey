"use client";
import type { SurveyResponse } from "@/lib/types";
import { SectionHeader } from "./SectionHeader";
import { median } from "@/lib/percentile";
import { formatDollar } from "@/lib/percentile";

function pct(n: number, total: number) {
  return total > 0 ? Math.round((n / total) * 100) : 0;
}

export function AllocationSection({ rows }: { rows: SurveyResponse[] }) {
  const withAssets = rows.filter((r) => r.assets.total !== null && r.assets.total > 0);
  const n = withAssets.length || 1;

  const avg = (getter: (r: SurveyResponse) => number | null) => {
    const vals = withAssets.map(getter).filter((v): v is number => v !== null && v >= 0);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  };

  const avgRetirement = avg((r) => r.assets.retirement);
  const avgTaxable = avg((r) => r.assets.taxable);
  const avgCash = avg((r) => (r.assets.cash ?? 0) + (r.assets.dedicated_savings ?? 0));
  const avgRealEstate = avg((r) => (r.assets.primary_residence ?? 0) + (r.assets.properties ?? 0));
  const avgOther = avg((r) => (r.assets.speculative ?? 0) + (r.assets.other ?? 0));
  const avgTotal = avgRetirement + avgTaxable + avgCash + avgRealEstate + avgOther || 1;

  const investmentPct = pct(avgRetirement + avgTaxable, avgTotal);
  const cashPct = pct(avgCash, avgTotal);
  const realEstatePct = pct(avgRealEstate, avgTotal);
  const otherPct = Math.max(0, 100 - investmentPct - cashPct - realEstatePct);

  const stackSegments = [
    { label: "Investment accounts", pct: investmentPct, color: "#0E9F6E" },
    { label: "Real estate", pct: realEstatePct, color: "#0A8657" },
    { label: "Cash & savings", pct: cashPct, color: "#3DDB9A" },
    { label: "Speculative / other", pct: otherPct, color: "#ADBDCC" },
  ].filter((s) => s.pct > 0);

  const accountTypes = [
    { label: "Tax-advantaged (401k/IRA)", val: avg((r) => r.assets.retirement), count: withAssets.filter((r) => (r.assets.retirement ?? 0) > 0).length },
    { label: "Taxable brokerage", val: avg((r) => r.assets.taxable), count: withAssets.filter((r) => (r.assets.taxable ?? 0) > 0).length },
    { label: "Primary residence", val: avg((r) => r.assets.primary_residence), count: withAssets.filter((r) => (r.assets.primary_residence ?? 0) > 0).length },
    { label: "Cash & savings", val: avg((r) => (r.assets.cash ?? 0) + (r.assets.dedicated_savings ?? 0)), count: withAssets.filter((r) => ((r.assets.cash ?? 0) + (r.assets.dedicated_savings ?? 0)) > 0).length },
    { label: "Investment properties", val: avg((r) => r.assets.properties), count: withAssets.filter((r) => (r.assets.properties ?? 0) > 0).length },
    { label: "Speculative / crypto", val: avg((r) => r.assets.speculative), count: withAssets.filter((r) => (r.assets.speculative ?? 0) > 0).length },
  ].sort((a, b) => b.val - a.val);
  const maxVal = Math.max(...accountTypes.map((a) => a.val), 1);

  const medNW = median(withAssets.map((r) => r.assets.total as number).filter(Boolean));

  return (
    <section data-section id="allocation">
      <SectionHeader
        number="06"
        eyebrow="How they're invested"
        title={`${investmentPct}% of assets sit in investment accounts — retirement and taxable brokerage.`}
        lede={
          <>
            The community runs a concentrated portfolio: the vast majority of wealth is held in
            tax-advantaged and taxable brokerage accounts. Real estate and cash are secondary.
          </>
        }
      />

      {/* Stacked horizontal bar */}
      <div className="bg-white border border-[var(--slate-050)] rounded-xl p-7 mb-6">
        <p
          style={{
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "var(--slate-400)",
            marginBottom: 12,
            fontWeight: 500,
          }}
        >
          Average asset allocation — all respondents with assets reported
        </p>
        <div
          style={{
            display: "flex",
            height: 36,
            borderRadius: 6,
            overflow: "hidden",
            gap: 2,
          }}
        >
          {stackSegments.map((s) => (
            <div
              key={s.label}
              style={{ width: `${s.pct}%`, background: s.color, flexShrink: 0 }}
              title={`${s.label}: ${s.pct}%`}
            />
          ))}
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "10px 24px",
            marginTop: 16,
          }}
        >
          {stackSegments.map((s) => (
            <span
              key={s.label}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--slate-600)" }}
            >
              <span style={{ width: 10, height: 10, borderRadius: 3, background: s.color, display: "inline-block" }} />
              {s.label}
              <strong style={{ color: "var(--navy)", fontVariantNumeric: "tabular-nums" }}>{s.pct}%</strong>
            </span>
          ))}
        </div>
      </div>

      {/* Account types hbar */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6">
        <div className="bg-white border border-[var(--slate-050)] rounded-xl p-7">
          <h3
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: "var(--navy)",
              marginBottom: 4,
            }}
          >
            Average balance by account type
          </h3>
          <p style={{ fontSize: 12, color: "var(--slate-400)", marginBottom: 20 }}>
            Among respondents reporting that account type.
          </p>
          {accountTypes.map((a) => (
            <div key={a.label} className="hbar">
              <span className="lbl">{a.label}</span>
              <div className="track">
                <div className="fill" style={{ width: `${(a.val / maxVal) * 100}%` }} />
              </div>
              <span className="val">{formatDollar(a.val, true)}</span>
            </div>
          ))}
        </div>

        {/* Summary stats */}
        <div className="rd-card rd-card--navy flex flex-col justify-between" style={{ minWidth: 240 }}>
          <div>
            <p
              style={{
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.10em",
                color: "rgba(255,255,255,0.55)",
                marginBottom: 12,
                fontWeight: 500,
              }}
            >
              Median total assets
            </p>
            <div className="bignum">
              {medNW !== null
                ? medNW >= 1_000_000
                  ? <>{(medNW / 1_000_000).toFixed(1).replace(/\.0$/, "")}<span className="unit">M</span></>
                  : <>{Math.round(medNW / 1000)}<span className="unit">k</span></>
                : "—"
              }
            </div>
          </div>
          <div
            style={{
              marginTop: 28,
              paddingTop: 20,
              borderTop: "1px solid rgba(255,255,255,0.15)",
            }}
          >
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", marginBottom: 6 }}>
              Respondents with assets reported
            </div>
            <div style={{ fontSize: 22, fontWeight: 500, color: "white", fontVariantNumeric: "tabular-nums" }}>
              {n.toLocaleString()} / {rows.length.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
