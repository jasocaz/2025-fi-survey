import { SectionHeader } from "./SectionHeader";

export function MethodologySection({ total, completed }: { total: number; completed: number }) {
  return (
    <section data-section id="methodology">
      <SectionHeader
        number="08"
        eyebrow="Caveats"
        title="What this data is, and what it isn't."
        lede={
          <>
            Every figure on this page is self-reported by a self-selecting community sample. Read
            it as a portrait of this community in this moment, not a population estimate.
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-8">
        <Note title="Sample">
          {total.toLocaleString()} total responses ({completed.toLocaleString()} completed,{" "}
          {(total - completed).toLocaleString()} partial). Both are included. Every field guards
          against missing values individually.
        </Note>

        <Note title="Who responded">
          Respondents self-selected by seeing the survey post on r/financialindependence and choosing
          to complete it. This community skews heavily toward high-income, US-based tech workers.
          The data is not representative of Americans, of Reddit, or of the general population.
        </Note>

        <Note title="Currency conversion">
          Non-USD amounts were converted at fixed reference rates (CAD 0.73, EUR 1.08, GBP 1.27,
          AUD 0.66, CHF 1.12, SGD 0.74, PLN 0.25, CZK 0.043). These are approximate and do not
          reflect market rates at the time of survey completion.
        </Note>

        <Note title="Outlier handling">
          Charts cap display at the 99th percentile to prevent outliers (e.g. one respondent with
          $42M in assets) from compressing the useful range. Underlying counts and medians include
          all values.
        </Note>

        <Note title="Free-text fields">
          Three free-text columns (job title, retirement misconceptions, unique circumstances) were
          dropped entirely. They are not used in any calculation and were not shipped to the client.
        </Note>

        <Note title="Compare-yourself tool">
          All comparisons are computed client-side. Nothing you enter is sent to a server. Inputs
          are saved to your browser&apos;s localStorage only. The &ldquo;years to FI&rdquo; estimate
          assumes 7% real annual return and flat savings — treat it as a rough order of magnitude,
          not a plan.
        </Note>
      </div>

      <div className="mt-12 pt-6 border-t border-[var(--slate-050)] text-xs text-[var(--slate-400)]">
        Data sourced from the 2025 r/financialindependence annual survey thread.
      </div>
    </section>
  );
}

function Note({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[15px] font-medium text-foreground mb-2 tracking-[-0.005em]">{title}</h3>
      <p className="text-sm text-[var(--slate-600)] leading-[1.55]">{children}</p>
    </div>
  );
}
