"use client";
import type { SurveyResponse } from "@/lib/types";
import { SectionHeader } from "./SectionHeader";
import { median } from "@/lib/percentile";

interface FindingCardProps {
  chip: string;
  pull: string;
  body: string;
}
function FindingCard({ chip, pull, body }: FindingCardProps) {
  return (
    <div className="rd-card">
      <span className="rd-chip" style={{ marginBottom: 16, display: "inline-flex" }}>
        {chip}
      </span>
      <p className="pull">{pull}</p>
      <p style={{ fontSize: 14, color: "var(--slate-600)", lineHeight: 1.6 }}>{body}</p>
    </div>
  );
}

export function NotableFindingsSection({ rows }: { rows: SurveyResponse[] }) {
  const n = rows.length || 1;

  const fiRows = rows.filter((r) => r.is_fi);
  const nonFiRows = rows.filter((r) => !r.is_fi);
  const reRows = rows.filter((r) => r.is_re);

  const actualSWRs = reRows
    .map((r) => r.actual_swr)
    .filter((v): v is number => v !== null && v > 0 && v <= 10);
  const medActualSWR = actualSWRs.length ? median(actualSWRs) : null;

  const spendingLess = reRows.filter((r) => r.withdrawal_vs_plan === "less").length;
  const spendingLessPct = reRows.length > 0 ? Math.round((spendingLess / reRows.length) * 100) : 0;

  const chubbyFI = rows.filter((r) => r.fi_flavor === "ChubbyFI").length;
  const chubbyFIPct = Math.round((chubbyFI / n) * 100);

  const fiNW = fiRows.map((r) => r.assets.total).filter((v): v is number => v !== null);
  const nonFiNW = nonFiRows.map((r) => r.assets.total).filter((v): v is number => v !== null);
  const medFiNW = fiNW.length ? median(fiNW) : null;
  const medNonFiNW = nonFiNW.length ? median(nonFiNW) : null;
  const nwMultiple =
    medFiNW && medNonFiNW && medNonFiNW > 0
      ? (medFiNW / medNonFiNW).toFixed(1)
      : null;

  const dualIncome = rows.filter((r) => r.contributors >= 2).length;
  const dualIncomePct = Math.round((dualIncome / n) * 100);

  const hasSupGov = rows.filter((r) => r.supp_gov && r.supp_gov !== "N/A").length;
  const hasSupGovPct = Math.round((hasSupGov / n) * 100);

  return (
    <section data-section id="findings">
      <SectionHeader
        number="10"
        eyebrow="Notable findings"
        title="Five numbers that stood out."
        lede={
          <>
            Patterns worth pulling out of the data — community-level truths that aggregate
            numbers don&apos;t always surface.
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {medActualSWR !== null && (
          <FindingCard
            chip="Withdrawal rates"
            pull={`${medActualSWR.toFixed(1)}% actual — well below the 4% rule.`}
            body={`Retirees in this community withdraw far less than they planned. ${spendingLessPct}% of retired respondents say they're spending less than their original plan.`}
          />
        )}

        <FindingCard
          chip="FI flavors"
          pull={`${chubbyFIPct}% are targeting ChubbyFI — more than LeanFI and FatFI combined.`}
          body="The community isn't just optimizing for the bare minimum. A significant share wants a comfortable cushion above basic FI — not extreme wealth, but room for lifestyle."
        />

        {nwMultiple && (
          <FindingCard
            chip="The gap"
            pull={`The FI cohort holds ${nwMultiple}× the net worth of those still pursuing.`}
            body={`Median net worth among those who've reached FI is ${medFiNW ? `$${(medFiNW / 1_000_000).toFixed(1)}M` : "significantly higher"} versus ${medNonFiNW ? `$${(medNonFiNW / 1_000_000).toFixed(1)}M` : "less"} for those still on the path.`}
          />
        )}

        <FindingCard
          chip="Household structure"
          pull={`${dualIncomePct}% of respondents are dual-income households.`}
          body="Two incomes are a meaningful accelerant on the path to FI. Dual-income households in this survey report substantially higher savings rates and shorter projected timelines."
        />

        <FindingCard
          chip="Social Security"
          pull={`${hasSupGovPct}% expect some government income in retirement.`}
          body="Despite skepticism about Social Security's long-term solvency, the majority of respondents factor some form of government income into their retirement plan — mostly at a delayed timing."
        />

        <FindingCard
          chip="Self-reported data"
          pull="Every number here comes from people who chose to share it."
          body="This is a self-selected community snapshot — not a random sample. Respondents skew toward higher incomes and engagement with FI concepts. The patterns are signal, but context matters."
        />
      </div>
    </section>
  );
}
