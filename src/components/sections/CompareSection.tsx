"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useVisitorProfile } from "@/hooks/useVisitorProfile";
import { PercentileBar } from "@/components/charts/PercentileBar";
import { formatDollar, ordinal, median } from "@/lib/percentile";
import { AGE_BRACKETS } from "@/lib/types";
import type { SurveyResponse, Precomputed } from "@/lib/types";

const AGE_IDX = Object.fromEntries(AGE_BRACKETS.map((b, i) => [b, i]));

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
      className="font-mono text-base border-stone-200 focus:border-[#0a7d4a] focus:ring-[#0a7d4a]"
    />
  );
}

function sorted(rows: SurveyResponse[], getter: (r: SurveyResponse) => number | null) {
  return rows.map(getter).filter((v): v is number => v !== null).sort((a, b) => a - b);
}

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

  // Peer cohort summaries
  const peers = results.peer_cohort;
  const peerMedianFI = median(peers.map((r) => r.fi_number).filter((v): v is number => v !== null));
  const peerMedianSWR = median(peers.map((r) => r.target_swr).filter((v): v is number => v !== null));
  const peerFlavors = peers.map((r) => r.fi_flavor).filter(Boolean) as string[];
  const topFlavor = peerFlavors.length
    ? Object.entries(peerFlavors.reduce<Record<string, number>>((acc, f) => ({ ...acc, [f]: (acc[f] ?? 0) + 1 }), {}))
        .sort((a, b) => b[1] - a[1])[0]
    : null;
  const peerPctFI = peers.length
    ? Math.round((peers.filter((r) => r.is_fi).length / peers.length) * 100)
    : null;

  // Share URL
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
    <section id="compare" className="max-w-7xl mx-auto px-6 py-8 border-t border-stone-100">
      <p className="text-xs font-semibold tracking-widest text-stone-600 uppercase mb-1">§02</p>
      <h2 className="font-serif text-3xl font-semibold text-stone-900 mb-1">
        How do you compare? (to this <em>community</em>)
      </h2>

      {/* Bias call-out */}
      <div className="my-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-xs font-semibold tracking-widest text-amber-700 uppercase mb-1">
          Who actually answered this survey?
        </p>
        <p className="text-sm text-amber-800 mb-3">
          When you compare your numbers below, remember who you&apos;re comparing against.
          This is <strong>not</strong> a representative sample of Americans, or of Reddit.
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            `${precomputed.pct_male}% male`,
            `${precomputed.pct_us}% US`,
            `${precomputed.pct_in_tech_eng}% in tech/eng`,
            precomputed.median_wages ? `median wages ${formatDollar(precomputed.median_wages, true)}` : null,
            `${precomputed.pct_college}% college-educated`,
          ].filter(Boolean).map((chip) => (
            <span key={chip as string} className="text-xs px-3 py-1 bg-white border border-amber-200 rounded-full text-amber-700 font-mono">
              {chip}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Inputs card */}
        <Card className="lg:col-span-2 border-stone-200 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold tracking-wider uppercase text-stone-500">
              Your numbers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Age slider */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-xs font-semibold tracking-wider text-stone-500 uppercase">Your age</label>
                <span className="text-xs font-mono font-semibold text-stone-700">{profile.age_bracket}</span>
              </div>
              <Slider
                min={0}
                max={AGE_BRACKETS.length - 1}
                step={1}
                value={[ageIdx >= 0 ? ageIdx : 2]}
                onValueChange={(vals) => { const arr = Array.isArray(vals) ? vals : [vals]; setProfile({ age_bracket: AGE_BRACKETS[arr[0]] }); }}
                className="[&_[role=slider]]:bg-[#0a7d4a] [&_[role=slider]]:border-[#0a7d4a]"
              />
              <div className="flex justify-between text-[10px] text-stone-400 mt-1">
                <span>21</span><span>66+</span>
              </div>
            </div>

            {/* Core inputs */}
            <div>
              <label className="text-xs font-semibold tracking-wider text-stone-500 uppercase block mb-1">Net worth ($)</label>
              {numInput(profile.net_worth, (v) => setProfile({ net_worth: v }), "e.g. 850000")}
            </div>
            <div>
              <label className="text-xs font-semibold tracking-wider text-stone-500 uppercase block mb-1">Annual household income ($)</label>
              {numInput(profile.income, (v) => setProfile({ income: v }), "e.g. 200000")}
            </div>

            {/* More section */}
            <button
              onClick={() => setShowMore(!showMore)}
              className="text-xs text-[#0a7d4a] font-semibold hover:underline"
            >
              {showMore ? "− Less" : "+ More fields (FI number, expenses, debt)"}
            </button>
            {showMore && (
              <div className="space-y-4 pt-1">
                <div>
                  <label className="text-xs font-semibold tracking-wider text-stone-500 uppercase block mb-1">Target FI number ($)</label>
                  {numInput(profile.fi_number, (v) => setProfile({ fi_number: v }), "e.g. 2500000")}
                </div>
                <div>
                  <label className="text-xs font-semibold tracking-wider text-stone-500 uppercase block mb-1">Annual expenses ($)</label>
                  {numInput(profile.expenses, (v) => setProfile({ expenses: v }), "e.g. 75000")}
                </div>
                <div>
                  <label className="text-xs font-semibold tracking-wider text-stone-500 uppercase block mb-1">Total debt (mortgage, loans, cards) ($)</label>
                  {numInput(profile.debt, (v) => setProfile({ debt: v }), "e.g. 320000")}
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-1 border-t border-stone-100">
              <p className="text-[10px] text-stone-400">Saved locally · nothing sent to a server</p>
              <button onClick={shareURL} className="text-xs text-[#0a7d4a] font-semibold hover:underline">
                ⎘ Share
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="lg:col-span-3 space-y-5">
          {/* Headline card */}
          {hasAnyInput && results.nw_pct_global !== null ? (
            <div className="p-5 bg-[#0a7d4a] rounded-lg text-white">
              <p className="text-xs font-semibold tracking-wider uppercase text-emerald-200 mb-1">Net worth</p>
              <p className="text-4xl font-bold font-mono">
                {ordinal(results.nw_pct_age ?? results.nw_pct_global!)}
                <span className="text-xl font-normal text-emerald-200 ml-2">percentile</span>
              </p>
              <p className="text-sm text-emerald-100 mt-1">
                among {profile.age_bracket} year olds in the survey
                {results.nw_pct_global !== results.nw_pct_age && ` · ${ordinal(results.nw_pct_global!)} overall`}
              </p>
            </div>
          ) : (
            <div className="p-5 bg-stone-50 rounded-lg border border-stone-200">
              <p className="text-stone-400 text-sm">Enter your net worth above to see your percentile.</p>
              <p className="text-xs text-stone-400 mt-1">
                The median respondent has <strong className="text-stone-600">$1.58M</strong> in net worth
                and is targeting <strong className="text-stone-600">$2.5M</strong> for FI.
              </p>
            </div>
          )}

          {/* Percentile bars */}
          <div className="space-y-1">
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

          {/* Peer cohort */}
          <div>
            {peers.length > 0 ? (
              <Card className="border-stone-200 shadow-none">
                <CardContent className="pt-4">
                  <p className="text-xs font-semibold tracking-wider uppercase text-stone-600 mb-2">
                    People like you (n={peers.length})
                  </p>
                  <div className="space-y-1.5 text-sm">
                    {peerMedianFI && (
                      <div className="flex justify-between">
                        <span className="text-stone-500">FI target</span>
                        <span className="font-mono font-semibold">{formatDollar(peerMedianFI, true)}</span>
                      </div>
                    )}
                    {peerMedianSWR && (
                      <div className="flex justify-between">
                        <span className="text-stone-500">Target SWR</span>
                        <span className="font-mono font-semibold">{peerMedianSWR.toFixed(2)}%</span>
                      </div>
                    )}
                    {topFlavor && (
                      <div className="flex justify-between">
                        <span className="text-stone-500">Top flavor</span>
                        <Badge variant="secondary" className="text-xs">{topFlavor[0].replace(" / Coast FI","")}</Badge>
                      </div>
                    )}
                    {peerPctFI !== null && (
                      <div className="flex justify-between">
                        <span className="text-stone-500">Already FI</span>
                        <span className="font-mono font-semibold text-[#0a7d4a]">{peerPctFI}%</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-stone-200 shadow-none">
                <CardContent className="pt-4">
                  <p className="text-xs font-semibold tracking-wider uppercase text-stone-600 mb-2">
                    People like you
                  </p>
                  <p className="text-sm text-stone-400">Enter age and net worth to find your closest peers in the survey</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
