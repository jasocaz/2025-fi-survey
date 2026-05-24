export function MethodologySection({ total, completed }: { total: number; completed: number }) {
  return (
    <section className="max-w-7xl mx-auto px-6 py-10 border-t border-stone-100">
      <p className="text-xs font-semibold tracking-widest text-stone-400 uppercase mb-1">§08</p>
      <h2 className="font-serif text-3xl font-semibold text-stone-900 mb-6">Methodology &amp; caveats</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
        <div className="space-y-4 text-sm text-stone-600">
          <div>
            <h3 className="font-semibold text-stone-800 mb-1">Sample</h3>
            <p>
              {total.toLocaleString()} total responses ({completed.toLocaleString()} completed,{" "}
              {(total - completed).toLocaleString()} partial). Both are included. All fields guard
              against missing values individually.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-stone-800 mb-1">Who responded</h3>
            <p>
              Respondents self-selected by seeing the survey post on r/financialindependence and
              choosing to complete it. This community skews heavily toward high-income US-based
              tech workers. The data is not representative of Americans, Reddit users, or the
              general population.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-stone-800 mb-1">Currency conversion</h3>
            <p>
              Non-USD amounts were converted at fixed reference rates (CAD 0.73, EUR 1.08,
              GBP 1.27, AUD 0.66, CHF 1.12, SGD 0.74, PLN 0.25, CZK 0.043). These are
              approximate and do not reflect market rates at the time of survey completion.
            </p>
          </div>
        </div>
        <div className="space-y-4 text-sm text-stone-600">
          <div>
            <h3 className="font-semibold text-stone-800 mb-1">Outlier handling</h3>
            <p>
              Charts cap display at the 99th percentile to prevent outliers (e.g. one respondent
              with $42M in assets) from compressing the useful range. Underlying counts and
              medians include all values.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-stone-800 mb-1">Free-text fields</h3>
            <p>
              Three free-text columns (job title, retirement misconceptions, unique circumstances)
              were dropped entirely. They are not used in any calculation and were not shipped
              to the client.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-stone-800 mb-1">Compare-yourself tool</h3>
            <p>
              All comparisons are computed client-side. Nothing you enter is sent to a server.
              Inputs are saved to your browser&apos;s localStorage only.
              The &ldquo;years to FI&rdquo; estimate assumes 7% real annual return and flat savings — treat
              it as a rough order-of-magnitude, not a plan.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-10 pt-6 border-t border-stone-100 text-xs text-stone-400">
        <p>Data sourced from the 2025 r/financialindependence annual survey thread.</p>
      </div>
    </section>
  );
}
