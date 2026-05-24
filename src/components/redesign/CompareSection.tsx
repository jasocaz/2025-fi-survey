"use client";
import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { useVisitorProfile } from "@/hooks/useVisitorProfile";
import { PercentileBar } from "./charts/PercentileBar";
import { formatDollar, ordinal, median } from "@/lib/percentile";
import { AGE_BRACKETS } from "@/lib/types";
import type { SurveyResponse, Precomputed } from "@/lib/types";
import { SectionHeader } from "./SectionHeader";

function numInput(val: number | null, onChange: (v: number | null) => void, placeholder: string) {
  return (
    <Input
      type="text"
      inputMode="numeric"
      placeholder={placeholder}
      value={val !== null ? val.toLocaleString() : ""}
      onChange={(e) => {
        const raw = e.target.value.replace(/[^0-9.]/g, "");
        onChange(raw ? parseFloat(raw) : null);
      }}
      className="font-mono numerics text-base border-[var(--slate-050)] focus:border-[var(--brand)] focus:ring-[var(--brand)]"
    />
  );
}

function sorted(rows: SurveyResponse[], getter: (r: SurveyResponse) => number | null) {
  return rows.map(getter).filter((v): v is number => v !== null).sort((a, b) => a - b);
}

const FIELD_LABEL = "text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--slate-500)]";

export function CompareSection({ allRows, precomputed }: { allRows: SurveyResponse[]; precomputed: Precomputed }) {
  const { profile, setProfile, results } = useVisitorProfile(allRows);
  const [showMore, setShowMore] = useState(false);

  const ageIdx = AGE_BRACKETS.indexOf(profile.age_bracket);
  const byAge = allRows.filter((r) => r.age_bracket === profile.age_bracket);

  const sortedNW = sorted(allRows, (r) => r.assets.total);
  const sortedNWAge = sorted(byAge, (r) => r.assets.total);
  const sortedInc = sorted(allRows, (r) => r.income.total);
  const sortedFI = sorted(allRows, (r) => r.fi_number);
  const sortedExp = sorted(allRows, (r) => r.expenses.total);
  const sortedDebt = sorted(allRows, (r) => r.debts.total);

  const hasAnyInput = profile.net_worth !== null || profile.income !== null;

  const peers = results.peer_cohort;
  const peerMedianFI = median(peers.map((r) => r.fi_number).filter((v): v is number => v !== null));
  const peerMedianSWR = median(peers.map((r) => r.target_swr).filter((v): v is number => v !== null));
  const peerFlavors = peers.map((r) => r.fi_flavor).filter(Boolean) as string[];
  const topFlavor = peerFlavors.length
    ? Object.entries(
        peerFlavors.reduce<Record<string, number>>((acc, f) => ({ ...acc, [f]: (acc[f] ?? 0) + 1 }), {}),
      ).sort((a, b) => b[1] - a[1])[0]
    : null;
  const peerPctFI = peers.length
    ? Math.round((peers.filter((r) => r.is_fi).length / peers.length) * 100)
    : null;

  const shareURL = () => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams();
    if (profile.net_worth) params.set("v_nw", String(profile.net_worth));
    if (profile.income) params.set("v_inc", String(profile.income));
    if (profile.fi_number) params.set("v_fi", String(profile.fi_number));
    if (profile.expenses) params.set("v_exp", String(profile.expenses));
    if (profile.debt) params.set("v_debt", String(profile.debt));
    params.set("v_age", profile.age_bracket);
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    navigator.clipboard.writeText(url);
  };

  return (
    <section data-section data-alt="true" id="compare">
      <div>
        <SectionHeader
          number="02"
          eyebrow="Compare yourself"
          title="How do you compare to this community?"
          lede={
            <>
              Enter your numbers on the left to see your percentile. Everything is computed in
              your browser — nothing is sent to a server.
            </>
          }
        />

        {/* Bias call-out */}
        <div
          className="mb-8 p-5 rounded-xl border border-[var(--slate-050)] bg-white"
        >
          <p className="text-[11px] font-medium uppercase tracking-[0.10em] text-[var(--slate-500)] mb-2">
            Who actually answered this survey?
          </p>
          <p className="text-sm text-[var(--slate-700)] mb-3 max-w-3xl">
            When you compare your numbers, remember who you&apos;re comparing against. This is{" "}
            <strong className="font-medium text-foreground">not</strong> a representative sample of
            Americans, or of Reddit.
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              `${precomputed.pct_male}% male`,
              `${precomputed.pct_us}% US`,
              `${precomputed.pct_in_tech}% in IT`,
              precomputed.median_wages ? `median wages ${formatDollar(precomputed.median_wages, true)}` : null,
              `${precomputed.pct_college}% college-educated`,
            ]
              .filter(Boolean)
              .map((chip) => (
                <span
                  key={chip as string}
                  className="text-[11px] px-3 py-1 rounded-full bg-[var(--slate-025)] text-[var(--slate-600)] font-mono numerics border border-[var(--slate-050)]"
                >
                  {chip}
                </span>
              ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Inputs */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-[var(--slate-050)] p-6">
            <p className="text-[11px] font-medium uppercase tracking-[0.10em] text-[var(--slate-500)] mb-5">
              Your numbers
            </p>

            <div className="space-y-5">
              {/* Age slider */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className={FIELD_LABEL}>Your age</label>
                  <span className="text-xs font-mono numerics font-medium text-foreground">
                    {profile.age_bracket}
                  </span>
                </div>
                <Slider
                  min={0}
                  max={AGE_BRACKETS.length - 1}
                  step={1}
                  value={[ageIdx >= 0 ? ageIdx : 2]}
                  onValueChange={(vals) => {
                    const arr = Array.isArray(vals) ? vals : [vals];
                    setProfile({ age_bracket: AGE_BRACKETS[arr[0]] });
                  }}
                  className="[&_[role=slider]]:bg-[var(--brand)] [&_[role=slider]]:border-[var(--brand)]"
                />
                <div className="flex justify-between text-[10px] text-[var(--slate-400)] mt-1">
                  <span>21</span>
                  <span>66+</span>
                </div>
              </div>

              <div>
                <label className={`${FIELD_LABEL} block mb-1.5`}>Net worth ($)</label>
                {numInput(profile.net_worth, (v) => setProfile({ net_worth: v }), "e.g. 850000")}
              </div>
              <div>
                <label className={`${FIELD_LABEL} block mb-1.5`}>Annual household income ($)</label>
                {numInput(profile.income, (v) => setProfile({ income: v }), "e.g. 200000")}
              </div>

              <button
                onClick={() => setShowMore(!showMore)}
                className="text-[11px] font-medium text-[var(--brand)] hover:underline"
              >
                {showMore ? "− Less" : "+ More fields (FI number, expenses, debt)"}
              </button>
              {showMore && (
                <div className="space-y-4 pt-1">
                  <div>
                    <label className={`${FIELD_LABEL} block mb-1.5`}>Target FI number ($)</label>
                    {numInput(profile.fi_number, (v) => setProfile({ fi_number: v }), "e.g. 2500000")}
                  </div>
                  <div>
                    <label className={`${FIELD_LABEL} block mb-1.5`}>Annual expenses ($)</label>
                    {numInput(profile.expenses, (v) => setProfile({ expenses: v }), "e.g. 75000")}
                  </div>
                  <div>
                    <label className={`${FIELD_LABEL} block mb-1.5`}>Total debt ($)</label>
                    {numInput(profile.debt, (v) => setProfile({ debt: v }), "e.g. 320000")}
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center pt-3 border-t border-[var(--slate-050)]">
                <p className="text-[10px] text-[var(--slate-400)]">
                  Saved locally · nothing sent to a server
                </p>
                <button
                  onClick={shareURL}
                  className="text-[11px] font-medium text-[var(--brand)] hover:underline"
                >
                  ⎘ Share
                </button>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-3 space-y-5">
            {hasAnyInput && results.nw_pct_global !== null ? (
              <div
                className="p-6 rounded-xl text-white"
                style={{ background: "var(--gradient-brand-deep)" }}
              >
                <p className="text-[11px] font-medium uppercase tracking-[0.10em] text-white/70 mb-2">
                  Net worth
                </p>
                <p className="text-5xl font-medium font-mono numerics tracking-[-0.025em]">
                  {ordinal(results.nw_pct_age ?? results.nw_pct_global!)}
                  <span className="text-xl font-normal text-white/70 ml-2 font-sans">
                    percentile
                  </span>
                </p>
                <p className="text-sm text-white/80 mt-2">
                  among {profile.age_bracket} year olds in the survey
                  {results.nw_pct_global !== results.nw_pct_age &&
                    ` · ${ordinal(results.nw_pct_global!)} overall`}
                </p>
              </div>
            ) : (
              <div className="p-6 rounded-xl bg-white border border-[var(--slate-050)]">
                <p className="text-sm text-[var(--slate-500)]">
                  Enter your net worth on the left to see your percentile.
                </p>
                <p className="text-[12px] text-[var(--slate-400)] mt-1">
                  The median respondent has{" "}
                  <strong className="text-[var(--slate-700)] font-medium">$1.58M</strong> in net
                  worth and is targeting{" "}
                  <strong className="text-[var(--slate-700)] font-medium">$2.5M</strong> for FI.
                </p>
              </div>
            )}

            <div className="bg-white rounded-xl border border-[var(--slate-050)] p-6 space-y-1">
              <PercentileBar
                label={`Net worth · age ${profile.age_bracket}`}
                sorted={sortedNWAge}
                value={profile.net_worth}
                percentile={results.nw_pct_age}
              />
              <PercentileBar
                label="Net worth · all respondents"
                sorted={sortedNW}
                value={profile.net_worth}
                percentile={results.nw_pct_global}
              />
              <PercentileBar
                label="Annual income"
                sorted={sortedInc}
                value={profile.income}
                percentile={results.income_pct_global}
              />
              {profile.fi_number !== null && (
                <PercentileBar
                  label="FI number target"
                  sorted={sortedFI}
                  value={profile.fi_number}
                  percentile={results.fi_number_pct_global}
                />
              )}
              {profile.expenses !== null && (
                <PercentileBar
                  label="Annual expenses"
                  sorted={sortedExp}
                  value={profile.expenses}
                  percentile={results.expenses_pct_global}
                />
              )}
              {profile.debt !== null && (
                <PercentileBar
                  label="Total debt"
                  sorted={sortedDebt}
                  value={profile.debt}
                  percentile={results.debt_pct_global}
                  lowerIsBetter={true}
                />
              )}
            </div>

            {peers.length > 0 ? (
              <div className="bg-white rounded-xl border border-[var(--slate-050)] p-6">
                <p className="text-[11px] font-medium uppercase tracking-[0.10em] text-[var(--slate-500)] mb-3">
                  People like you · n={peers.length}
                </p>
                <div className="space-y-1.5 text-sm">
                  {peerMedianFI && (
                    <div className="flex justify-between">
                      <span className="text-[var(--slate-500)]">FI target</span>
                      <span className="font-mono numerics font-medium">
                        {formatDollar(peerMedianFI, true)}
                      </span>
                    </div>
                  )}
                  {peerMedianSWR && (
                    <div className="flex justify-between">
                      <span className="text-[var(--slate-500)]">Target SWR</span>
                      <span className="font-mono numerics font-medium">{peerMedianSWR.toFixed(2)}%</span>
                    </div>
                  )}
                  {topFlavor && (
                    <div className="flex justify-between">
                      <span className="text-[var(--slate-500)]">Top flavor</span>
                      <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-[var(--brand-soft)] text-[var(--brand-dark)]">
                        {topFlavor[0].replace(" / Coast FI", "")}
                      </span>
                    </div>
                  )}
                  {peerPctFI !== null && (
                    <div className="flex justify-between">
                      <span className="text-[var(--slate-500)]">Already FI</span>
                      <span className="font-mono numerics font-medium text-[var(--brand)]">
                        {peerPctFI}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-[var(--slate-050)] p-6">
                <p className="text-[11px] font-medium uppercase tracking-[0.10em] text-[var(--slate-500)] mb-2">
                  People like you
                </p>
                <p className="text-sm text-[var(--slate-400)]">
                  Enter age and net worth to find your closest peers in the survey.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
