import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Suspense } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "2025 Survey Results for /r/financialindependence",
  description:
    "Interactive analysis of 1,149 self-reported responses from the r/financialindependence community on net worth, FI targets, expenses, and the path to financial independence.",
  openGraph: {
    title: "2025 Survey Results for /r/financialindependence",
    description:
      "1,149 responses · $1.58M median net worth · $2.5M median FI target · 26% already FI",
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
      </body>
    </html>
  );
}
