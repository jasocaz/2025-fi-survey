export function percentileOf(sortedValues: number[], value: number): number {
  if (sortedValues.length === 0) return 50;
  let lo = 0, hi = sortedValues.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (sortedValues[mid] < value) lo = mid + 1;
    else hi = mid;
  }
  return Math.round((lo / sortedValues.length) * 100);
}

export function percentileValue(sorted: number[], p: number): number {
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

export function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return percentileValue(sorted, 50);
}

export function p99Cap(sorted: number[]): number {
  return percentileValue(sorted, 99);
}

export function yearsToFI(
  currentNW: number,
  targetNW: number,
  annualSavings: number,
  realReturn = 0.07,
): number | null {
  if (targetNW <= currentNW) return 0;
  if (annualSavings <= 0) return null;
  // FV = PV*(1+r)^n + PMT*((1+r)^n - 1)/r  →  solve for n numerically
  let years = 0;
  let nw = currentNW;
  while (nw < targetNW && years < 100) {
    nw = nw * (1 + realReturn) + annualSavings;
    years++;
  }
  return years < 100 ? years : null;
}

export function formatDollar(n: number, compact = false): string {
  if (compact) {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${Math.round(n / 1_000)}k`;
  }
  return `$${Math.round(n).toLocaleString()}`;
}

export function ordinal(n: number): string {
  const s = ["th","st","nd","rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
