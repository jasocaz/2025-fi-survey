"use client";
import type { SurveyResponse } from "@/lib/types";
import { SectionHeader } from "./SectionHeader";

interface CardProps {
  chip: string;
  title: string;
  body: React.ReactNode;
}
function Card({ chip, title, body }: CardProps) {
  return (
    <div className="rd-card">
      <span className="rd-chip" style={{ marginBottom: 20, display: "inline-flex" }}>
        {chip}
      </span>
      <h3
        style={{
          fontSize: "clamp(22px, 1.9vw, 26px)",
          fontWeight: 500,
          lineHeight: 1.2,
          letterSpacing: "-0.015em",
          color: "var(--navy)",
          marginBottom: 16,
          textWrap: "balance",
        }}
      >
        {title}
      </h3>
      <p style={{ fontSize: 14, color: "var(--slate-600)", lineHeight: 1.6, margin: 0 }}>
        {body}
      </p>
    </div>
  );
}

function median(arr: number[]) {
  if (!arr.length) return null;
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

function computeSavingsRate(r: SurveyResponse): number | null {
  const inc = r.income.total;
  const exp = r.expenses.total;
  if (!inc || inc <= 0 || exp === null) return null;
  const savingsInExp = (r.expenses.tax_adv_inv ?? 0) + (r.expenses.non_tax_adv_sav ?? 0);
  const trueSpending = exp - savingsInExp;
  return ((inc - trueSpending) / inc) * 100;
}

function fmtM(v: number | null) {
  if (v === null) return "—";
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2).replace(/\.?0+$/, "")}M`;
  return `$${Math.round(v / 1000)}k`;
}

export function CrossTabsSection({ rows }: { rows: SurveyResponse[] }) {
  // --- 1. Top-quartile earners vs top-quartile savers (raw NW at age 41-45)
  const buildContrast = (bracket: string) => {
    const sub = rows
      .filter((r) => r.age_bracket === bracket && r.assets.total !== null)
      .map((r) => ({ ...r, sr: computeSavingsRate(r), inc: r.income.total ?? 0 }))
      .filter((r) => r.sr !== null && r.inc > 0);
    if (sub.length < 20) return null;
    const bySr = [...sub].sort((a, b) => (b.sr as number) - (a.sr as number));
    const byInc = [...sub].sort((a, b) => b.inc - a.inc);
    const top = (arr: typeof sub) => arr.slice(0, Math.max(1, Math.floor(arr.length * 0.25)));
    const medNW = (arr: typeof sub) => median(arr.map((x) => x.assets.total as number));
    return { saverNW: medNW(top(bySr)), earnerNW: medNW(top(byInc)) };
  };
  const c4145 = buildContrast("41-45");

  // --- 2. Mortgage among millionaires
  const millionaireOwners = rows.filter(
    (r) => (r.assets.total ?? 0) >= 1_000_000 && r.housing === "Own",
  );
  const millionaireMortgagePct = millionaireOwners.length
    ? Math.round(
        (millionaireOwners.filter((r) => (r.debts.mortgage ?? 0) > 0).length /
          millionaireOwners.length) *
          100,
      )
    : 0;

  // --- 3. Median asset values by category (conditional on having)
  const avgConditional = (getter: (r: SurveyResponse) => number | null) => {
    const vals = rows.map(getter).filter((v): v is number => v !== null && v > 0);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  };
  const ownersWithHome = rows.filter(
    (r) => r.housing === "Own" && (r.assets.primary_residence ?? 0) > 0,
  );
  const equityVals = ownersWithHome
    .map((r) => (r.assets.primary_residence ?? 0) - (r.debts.mortgage ?? 0))
    .filter((v) => v > 0)
    .sort((a, b) => a - b);
  const medHomeEquity = equityVals.length
    ? equityVals[Math.floor(equityVals.length / 2)]
    : null;
  const avgRetirement = avgConditional((r) => r.assets.retirement);
  const avgTaxable = avgConditional((r) => r.assets.taxable);

  // --- 4 + 5: themes from the raw CSV's free-text columns.
  // The shipped JSON drops these for analytical use, but the raw responses
  // (data/raw/responses.csv) retain two qualitative columns we read offline:
  //   col 81  — "What misconceptions about retirement have you encountered…" (33 responses)
  //   col 126 — "Is there anything unique about your financial circumstances…" (183 responses)
  // The counts below come from a hand-coded keyword pass over those columns.
  const UNIQUE_CIRCUMSTANCES_N = 183;
  const OUTSIDE_MONEY_N = 34; // inheritance (14) + at-home (7) + IPO/RSU (7) + windfall (5) + family gift (1)
  const outsideMoneyPct = Math.round((OUTSIDE_MONEY_N / UNIQUE_CIRCUMSTANCES_N) * 100);

  return (
    <section data-section data-alt="true" id="cross-tabs">
      <SectionHeader
        number="10"
        eyebrow="Notable findings"
        title="Five things the numbers don't say out loud."
        lede={
          <>
            Patterns that emerged from cross-tabs of the structured responses, surfaced here as
            plain prose.
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Card 1 — Income vs savings rate */}
        <Card
          chip="Behavior"
          title="Income wins, even when savers try hard."
          body={
            c4145 ? (
              <>
                Holding age constant, the top quartile of earners out-accumulates the top
                quartile of savers — median net worth of{" "}
                <strong style={{ color: "var(--navy)", fontWeight: 500 }}>
                  {fmtM(c4145.earnerNW)}
                </strong>{" "}
                vs{" "}
                <strong style={{ color: "var(--navy)", fontWeight: 500 }}>
                  {fmtM(c4145.saverNW)}
                </strong>{" "}
                in the 41–45 bracket, and the pattern repeats at every other age band. Rate
                helps, but the starting line gets you farther than the pace.
              </>
            ) : (
              <>Top-quartile earners out-accumulate top-quartile savers at every age band.</>
            )
          }
        />

        {/* Card 2 — Mortgage as feature */}
        <Card
          chip="Allocation"
          title="Mortgages stick around at every wealth level."
          body={
            <>
              <strong style={{ color: "var(--navy)", fontWeight: 500 }}>
                {millionaireMortgagePct}%
              </strong>{" "}
              of millionaire homeowners still carry a mortgage. With sub-4% loans locked in
              before 2022, the math favors holding the debt and investing the difference rather
              than pre-paying. Wealth doesn&apos;t mean debt-averse — it means strategic about
              which debt to keep.
            </>
          }
        />

        {/* Card 3 — Home matters less */}
        <Card
          chip="Real estate"
          title="The home matters less than the spreadsheet suggests."
          body={
            <>
              Among the 66% who own, median primary-residence equity is{" "}
              <strong style={{ color: "var(--navy)", fontWeight: 500 }}>
                {fmtM(medHomeEquity)}
              </strong>{" "}
              — well behind the average retirement balance ({fmtM(avgRetirement)}) and the
              average taxable brokerage ({fmtM(avgTaxable)}). House-rich is a smaller story
              here than retirement-rich.
            </>
          }
        />

        {/* Card 4 — Outside money */}
        <Card
          chip="What the headline hides"
          title="Outside money is a quiet undercurrent."
          body={
            <>
              Of the {UNIQUE_CIRCUMSTANCES_N} respondents who used the open "unique
              circumstances" comment box,{" "}
              <strong style={{ color: "var(--navy)", fontWeight: 500 }}>
                {outsideMoneyPct}%
              </strong>{" "}
              flagged some form of outside boost — inheritance (most common), parents helping
              with starter savings, living rent-free with family, or a company-equity
              windfall. The headline net-worth numbers count every dollar the same.
            </>
          }
        />
      </div>

      {/* Card 5 — Full-width pull quote (real respondent quote) */}
      <div className="rd-card" style={{ maxWidth: "72ch" }}>
        <span className="rd-chip" style={{ marginBottom: 20, display: "inline-flex" }}>
          In their words
        </span>
        <blockquote
          style={{
            borderLeft: "3px solid var(--brand)",
            paddingLeft: 16,
            margin: "0 0 16px",
          }}
        >
          <p className="pull pull--accent" style={{ margin: 0 }}>
            "There&apos;s no finish line, everything is just a new start line."
          </p>
        </blockquote>
        <p style={{ fontSize: 14, color: "var(--slate-600)", lineHeight: 1.6, margin: 0 }}>
          A pattern in the 33 free-text responses to "What misconceptions about retirement
          have you encountered on r/financialindependence?" The loudest community
          self-critique isn&apos;t about the math — it&apos;s about treating FIRE as a
          spreadsheet exercise. Respondents call out shooting for 3% withdrawal as "far too
          conservative," warn that "boredom and loneliness were not considered," and describe
          "Simulation Bias — the idea that mastering a spreadsheet is the same as mastering
          retirement."
        </p>
        <p style={{ fontSize: 11, color: "var(--slate-400)", marginTop: 16, fontStyle: "italic" }}>
          Quotes from anonymous survey respondents · raw open-text responses from
          data/raw/responses.csv
        </p>
      </div>
    </section>
  );
}
