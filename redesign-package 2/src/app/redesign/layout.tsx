import type { Metadata } from "next";
import "./styles.css";
import precomputed from "@/app/data/precomputed.json";

const fmtCompact = (n: number) =>
  n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(2).replace(/\.?0+$/, "")}M`
    : `$${Math.round(n / 1000)}k`;

export const metadata: Metadata = {
  title: "2025 FI Survey · Redesign",
  description: `A redesigned view of ${precomputed.total.toLocaleString()} self-reported responses from the r/financialindependence community.`,
  openGraph: {
    title: "2025 FI Survey · Redesign",
    description: `${precomputed.total.toLocaleString()} responses · ${precomputed.median_nw ? fmtCompact(precomputed.median_nw) : "—"} median net worth · ${precomputed.median_fi_number ? fmtCompact(precomputed.median_fi_number) : "—"} median FI target · ${precomputed.pct_fi}% already FI`,
    type: "website",
  },
};

export default function RedesignLayout({ children }: { children: React.ReactNode }) {
  return <div data-theme="redesign">{children}</div>;
}
