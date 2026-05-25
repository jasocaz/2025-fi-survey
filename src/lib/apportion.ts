/**
 * Largest-Remainder (Hamilton) apportionment for percentage charts.
 *
 * Given a set of nonnegative raw values, return integer percentages that:
 *   - sum to exactly 100 (when at least one raw value is > 0),
 *   - differ from naive Math.round((raw / total) * 100) by at most 1.
 *
 * Method: each slice gets `floor(exact)` points up front. The 0..N-1 leftover
 * points (where N = number of slices) are then distributed one-by-one to the
 * slices with the largest fractional remainder. Ties are broken by descending
 * raw value, so when two slices both deserve a stray point equally, the
 * larger bucket absorbs it first (matches intuition: a 0.5 rounder on the
 * biggest slice rounds up before the same rounder on a small slice).
 */
export type Slice<T extends string = string> = { key: T; raw: number };

export function apportionTo100<T extends string>(parts: Slice<T>[]): { key: T; value: number }[] {
  const total = parts.reduce((s, p) => s + Math.max(0, p.raw), 0);
  if (total <= 0) return parts.map((p) => ({ key: p.key, value: 0 }));

  const scaled = parts.map((p, idx) => {
    const raw = Math.max(0, p.raw);
    const exact = (raw / total) * 100;
    const floor = Math.floor(exact);
    return { idx, key: p.key, raw, exact, floor, frac: exact - floor };
  });

  const allocated = scaled.reduce((s, p) => s + p.floor, 0);
  const leftover = 100 - allocated; // 0..N-1

  const order = [...scaled].sort((a, b) => b.frac - a.frac || b.raw - a.raw);
  const bonus = new Set<number>();
  for (let i = 0; i < leftover && i < order.length; i++) bonus.add(order[i].idx);

  return scaled.map((p) => ({ key: p.key, value: p.floor + (bonus.has(p.idx) ? 1 : 0) }));
}

/**
 * Dev-only audit: warn if a set of percentages that should sum to 100 does
 * not. Call wherever a "100% chart" is rendered to catch future regressions.
 * No-op in production builds.
 */
export function auditSumsTo100(label: string, values: number[]): void {
  if (process.env.NODE_ENV === "production") return;
  const sum = values.reduce((a, b) => a + b, 0);
  if (sum !== 100 && sum !== 0) {
    // eslint-disable-next-line no-console
    console.warn(`[chart audit] "${label}" slices sum to ${sum}% (expected 100%)`, values);
  }
}
