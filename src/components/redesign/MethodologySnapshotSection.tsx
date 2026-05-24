"use client";
import type { Precomputed } from "@/lib/types";
import { SectionHeader } from "./SectionHeader";

interface Props {
  precomputed: Precomputed;
}

/**
 * Intro section sitting between the hero and the demographics breakdown.
 * Establishes "what is this data, how was it gathered" before the reader
 * sees any percentile. Mirrors the mockup's "A self-reported snapshot…" section.
 */
export function MethodologySnapshotSection({ precomputed }: Props) {
  return (
    <section data-section id="snapshot">
      <SectionHeader
        number="01"
        eyebrow="Methodology"
        title="A self-reported snapshot, drawn from one subreddit."
        lede={
          <>
            The survey ran in 2025, promoted in the r/financialindependence
            community. Every figure on this page comes from respondents&apos; own
            answers &mdash; no accounts were linked or verified.
          </>
        }
      />

      {/* 4-step process diagram */}
      <div className="relative grid grid-cols-1 md:grid-cols-4 gap-8 mb-14">
        {/* Dotted connecting line behind the badges (desktop only) */}
        <div
          aria-hidden
          className="hidden md:block absolute top-[18px] left-6 right-6 border-t border-dashed"
          style={{ borderColor: "var(--slate-200)" }}
        />
        {STEPS.map((step, i) => (
          <Step key={i} index={i + 1} title={step.title}>
            {step.body}
          </Step>
        ))}
      </div>

      {/* KPI row */}
      <dl className="grid grid-cols-2 md:grid-cols-4 border-t border-b border-[var(--slate-050)] md:divide-x md:divide-[var(--slate-050)] divide-y md:divide-y-0">
        <Kpi value={precomputed.total.toLocaleString()} sub={`${precomputed.completed.toLocaleString()} completed; remainder partial.`}>
          Responses retained
        </Kpi>
        <Kpi value={`${precomputed.pct_us}%`} sub="US-based; international respondents converted at fixed rates.">
          US share
        </Kpi>
        <Kpi value={`${precomputed.pct_in_tech}%`} sub="Tech-adjacent — software, IT, engineering, finance.">
          Tech-adjacent
        </Kpi>
        <Kpi value={`${precomputed.pct_college}%`} sub="At least a bachelor's degree.">
          College-educated
        </Kpi>
      </dl>
    </section>
  );
}

const STEPS = [
  {
    title: "Promoted in-community",
    body: "Posted to r/financialindependence and surfaced through the community's regular threads.",
  },
  {
    title: "Self-reported",
    body: "Dozens of questions across demographics, balance sheet, income, expenses, allocation, and outlook.",
  },
  {
    title: "Normalized",
    body: "Non-USD amounts converted at fixed reference rates. Both completed and partial submissions retained. Free-text columns kept aside and used only for qualitative notes — never piped into charts.",
  },
  {
    title: "Analyzed",
    body: "Medians used for headline numbers; means reported alongside when distributions run heavy-tailed.",
  },
];

function Step({ index, title, children }: { index: number; title: string; children: React.ReactNode }) {
  return (
    <div className="relative z-[1]">
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center font-medium text-sm mb-4 bg-white"
        style={{
          color: "var(--brand)",
          border: "1px solid var(--brand)",
        }}
      >
        {index}
      </div>
      <h4 className="text-[15px] font-medium text-foreground mb-1.5 tracking-[-0.005em]">{title}</h4>
      <p className="text-[13px] text-[var(--slate-600)] leading-[1.5]">{children}</p>
    </div>
  );
}

function Kpi({ children, value, sub }: { children: React.ReactNode; value: string; sub: string }) {
  return (
    <div className="py-6 md:px-7 md:first:pl-0 md:last:pr-0">
      <dt className="text-[11px] uppercase tracking-[0.10em] text-[var(--slate-500)] mb-3 font-medium">
        {children}
      </dt>
      <dd className="font-medium leading-none tracking-[-0.025em] numerics text-[clamp(28px,2.6vw,36px)] text-foreground">
        {value}
      </dd>
      <p className="mt-3 text-[13px] leading-[1.4] text-[var(--slate-500)] max-w-[26ch]">{sub}</p>
    </div>
  );
}
