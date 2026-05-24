import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./styles.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Suspense } from "react";
import { Analytics } from "@vercel/analytics/next";
import precomputed from "./data/precomputed.json";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fmtCompact = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2).replace(/\.?0+$/, "")}M` : `$${Math.round(n / 1000)}k`;

export const metadata: Metadata = {
  title: "2025 Survey Results for /r/financialindependence",
  description: `Interactive analysis of ${precomputed.total.toLocaleString()} self-reported responses from the r/financialindependence community on net worth, FI targets, expenses, and the path to financial independence.`,
  openGraph: {
    title: "2025 Survey Results for /r/financialindependence",
    description: `${precomputed.total.toLocaleString()} responses · ${precomputed.median_nw ? fmtCompact(precomputed.median_nw) : "—"} median net worth · ${precomputed.median_fi_number ? fmtCompact(precomputed.median_fi_number) : "—"} median FI target · ${precomputed.pct_fi}% already FI`,
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <body className="min-h-screen bg-[#fbfaf7] text-stone-900">
        <TooltipProvider>
          <Suspense>{children}</Suspense>
        </TooltipProvider>
        <Analytics />
      </body>
    </html>
  );
}
