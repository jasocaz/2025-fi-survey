"use client";
import { useEffect, useState } from "react";

const DISMISS_KEY = "tip_jar_dismissed_v1";
const DELAY_MS = 30_000;
const TIP_URL = "https://buy.stripe.com/3cIfZ22pHe3SaBHe799k404";

export function TipJarPopup() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (sessionStorage.getItem(DISMISS_KEY)) return;
    } catch {}
    const timer = setTimeout(() => setVisible(true), DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    setVisible(false);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {}
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Tip jar"
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[300px] max-w-[calc(100vw-2rem)] bg-white border border-[var(--slate-050)] rounded-xl p-4 animate-in fade-in slide-in-from-bottom-3 duration-500"
      style={{
        fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
        boxShadow: "0 12px 32px rgba(10, 37, 64, 0.14), 0 2px 8px rgba(10, 37, 64, 0.06)",
      }}
    >
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="absolute top-2 right-2 w-7 h-7 inline-flex items-center justify-center rounded-full text-[var(--slate-400)] hover:text-[var(--navy)] hover:bg-[var(--slate-025)] text-base leading-none transition-colors"
      >
        ×
      </button>
      <p className="text-[14px] text-[var(--navy)] pr-7 leading-[1.45] tracking-[-0.005em]">
        Enjoyed this?{" "}
        <a
          href={TIP_URL}
          target="_blank"
          rel="noopener"
          onClick={dismiss}
          className="font-medium text-[var(--brand)] hover:text-[var(--brand-dark)] underline underline-offset-2 decoration-[var(--brand)]/40 hover:decoration-[var(--brand-dark)] transition-colors"
        >
          Help fuel
        </a>{" "}
        the next one.
      </p>
    </div>
  );
}
