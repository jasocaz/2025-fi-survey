import { cn } from "@/lib/utils";

interface Props {
  /** Two-digit section number, e.g. "01". */
  number: string;
  /** Short eyebrow above the title — UPPERCASED, tracked. */
  eyebrow: string;
  /** The h2. */
  title: string;
  /** Optional lede paragraph under the title. */
  lede?: React.ReactNode;
  className?: string;
}

/**
 * Consistent section header used across every report section.
 * Spine layout: 280px meta column on the left (number + eyebrow),
 * everything else in the right column. Collapses to a single column
 * on mobile.
 */
export function SectionHeader({ number, eyebrow, title, lede, className }: Props) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-[200px_1fr] gap-2 md:gap-16 md:items-end mb-10",
        className,
      )}
    >
      <div className="flex md:flex-col md:gap-1 items-baseline gap-4">
        <div className="font-mono text-xs text-slate-400 numerics">/ {number}</div>
        <div className="eyebrow">{eyebrow}</div>
      </div>
      <div>
        <h2 className="text-3xl md:text-[44px] font-medium leading-[1.05] tracking-[-0.02em] text-foreground mb-3">
          {title}
        </h2>
        {lede && (
          <p className="text-base md:text-[19px] text-slate-600 leading-[1.5] max-w-[60ch]">
            {lede}
          </p>
        )}
      </div>
    </div>
  );
}
