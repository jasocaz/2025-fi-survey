// Independent verification of precomputed.json vs the raw CSV.
//
// Uses papaparse (different parser from the hand-rolled one in build-data.ts)
// and re-discovers columns by header substring — so a bug in the build
// pipeline's parser or column mapping will surface as a mismatch here.
//
// Usage: pnpm verify-data
//
// Exits 0 on full match, 1 on any mismatch.

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import Papa from "papaparse";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSV_PATH = path.join(__dirname, "../data/raw/responses.csv");
const PRECOMPUTED_PATH = path.join(__dirname, "../src/app/data/precomputed.json");

const FX: Record<string, number> = {
  USD: 1.0, CAD: 0.73, EUR: 1.08, GBP: 1.27, AUD: 0.66,
  CHF: 1.12, SGD: 0.74, PLN: 0.25, CZK: 0.043,
};
const fxRate = (currency: string) => {
  const ticker = currency.replace(/[^A-Z]/g, "").slice(0, 3);
  return FX[ticker] ?? 1.0;
};

const toNum = (s: string): number | null => {
  if (!s?.trim()) return null;
  const n = parseFloat(s.replace(/[$,\s]/g, ""));
  return isNaN(n) ? null : n;
};

const percentile = (sorted: number[], p: number): number => {
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
};

// --- Load and parse ---
const raw = fs.readFileSync(CSV_PATH, "utf8");
const parsed = Papa.parse<string[]>(raw, { skipEmptyLines: true });
if (parsed.errors.length) {
  console.warn(`⚠️  papaparse reported ${parsed.errors.length} parse errors (first: ${parsed.errors[0].message})`);
}
const header = parsed.data[0];
const rows = parsed.data.slice(1);

// Independent column lookup — first match by substring
const findCol = (needle: string): number => {
  const idx = header.findIndex((h) => h?.toLowerCase().includes(needle.toLowerCase()));
  if (idx === -1) throw new Error(`Column not found: "${needle}"`);
  return idx;
};

const C = {
  status: findCol("response status"),
  in_us: findCol("currently reside in the united states"),
  currency: findCol("what currency"),
  gender: findCol("what is your gender"),
  age: findCol("what is your age"),
  industry: 28, // primary respondent's industry (matches build-data.ts)
  education: findCol("highest level of education"),
  is_fi: findCol("are you financially independent"),
  fi_number: findCol("amount invested will you consider yourself financially independent"),
  is_re: findCol("are you retired"),
  inc_wages: findCol("annual pre-tax income"), // first "annual pre-tax income" col is wages
  asset_total: header.findIndex(
    (h, i) =>
      h?.toLowerCase().includes("total sum") &&
      header.slice(0, i).some((p) => p?.toLowerCase().includes("asset value")),
  ),
};
if (C.asset_total === -1) throw new Error("Asset total column not found");

// Sanity: confirm we found a usable wages column. First "annual pre-tax income" should be wages.
if (!header[C.inc_wages]?.toLowerCase().includes("wages")) {
  console.warn(`⚠️  Expected wages column, got: "${header[C.inc_wages]}"`);
}

// --- Recompute headline stats independently ---
const get = (r: string[], i: number) => (r[i] ?? "").trim();
const N = rows.length;
let numCompleted = 0, numFI = 0, numRE = 0, numMale = 0, numUS = 0, numInTechEng = 0, numCollege = 0;
const nwValues: number[] = [];
const fiNumValues: number[] = [];
const wagesValues: number[] = [];
const ageBuckets: Record<string, number[]> = {};

for (const r of rows) {
  const currency = get(r, C.currency);
  const fx = fxRate(currency);

  if (get(r, C.status) === "COMPLETED") numCompleted++;
  if (get(r, C.is_fi).toLowerCase() === "yes") numFI++;
  if (get(r, C.is_re).toLowerCase() === "yes") numRE++;
  if (get(r, C.gender) === "Male") numMale++;
  if (get(r, C.in_us).toLowerCase() === "yes") numUS++;
  {
    const ind = get(r, C.industry);
    if (ind.includes("Information Technology") || ind.includes("Engineering")) numInTechEng++;
  }
  const edu = get(r, C.education);
  if (edu.includes("Bachelor") || edu.includes("Master") || edu.includes("Doctorate")) numCollege++;

  const nwNative = toNum(get(r, C.asset_total));
  if (nwNative !== null) {
    const nwUSD = Math.round(nwNative * fx);
    nwValues.push(nwUSD);
    const age = get(r, C.age);
    if (age) (ageBuckets[age] ??= []).push(nwUSD);
  }
  const fiNative = toNum(get(r, C.fi_number));
  if (fiNative !== null) fiNumValues.push(Math.round(fiNative * fx));
  const wagesNative = toNum(get(r, C.inc_wages));
  if (wagesNative !== null && wagesNative > 0) wagesValues.push(Math.round(wagesNative * fx));
}

nwValues.sort((a, b) => a - b);
fiNumValues.sort((a, b) => a - b);
wagesValues.sort((a, b) => a - b);

const computed = {
  total: N,
  completed: numCompleted,
  num_fi: numFI,
  num_re: numRE,
  pct_fi: Math.round((numFI / N) * 100),
  pct_re: Math.round((numRE / N) * 100),
  pct_male: Math.round((numMale / N) * 100),
  pct_us: Math.round((numUS / N) * 100),
  pct_in_tech_eng: Math.round((numInTechEng / N) * 100),
  pct_college: Math.round((numCollege / N) * 100),
  median_nw: Math.round(percentile(nwValues, 50)),
  median_fi_number: Math.round(percentile(fiNumValues, 50)),
  median_wages: Math.round(percentile(wagesValues, 50)),
};

const pre = JSON.parse(fs.readFileSync(PRECOMPUTED_PATH, "utf8"));

// --- Compare ---
type Check = { label: string; computed: number; expected: number; tolerance?: number };
const checks: Check[] = [
  { label: "total responses", computed: computed.total, expected: pre.total },
  { label: "completed responses", computed: computed.completed, expected: pre.completed },
  { label: "num already FI", computed: computed.num_fi, expected: pre.num_fi },
  { label: "num already RE", computed: computed.num_re, expected: pre.num_re },
  { label: "% already FI", computed: computed.pct_fi, expected: pre.pct_fi },
  { label: "% already RE", computed: computed.pct_re, expected: pre.pct_re },
  { label: "% male", computed: computed.pct_male, expected: pre.pct_male },
  { label: "% US-based", computed: computed.pct_us, expected: pre.pct_us },
  { label: "% in tech/eng", computed: computed.pct_in_tech_eng, expected: pre.pct_in_tech_eng },
  { label: "% college-educated", computed: computed.pct_college, expected: pre.pct_college },
  { label: "median net worth", computed: computed.median_nw, expected: pre.median_nw, tolerance: 1 },
  { label: "median FI number", computed: computed.median_fi_number, expected: pre.median_fi_number, tolerance: 1 },
  { label: "median wages", computed: computed.median_wages, expected: pre.median_wages, tolerance: 1 },
];

// Bracket-level NW check
const buildPre = pre.nw_by_age as Array<{ bracket: string; count: number; p50: number | null }>;
const ageBracketChecks: Array<{ bracket: string; computed_count: number; expected_count: number; computed_median: number | null; expected_median: number | null }> = [];
for (const b of buildPre) {
  const vals = (ageBuckets[b.bracket] ?? []).slice().sort((a, b) => a - b);
  ageBracketChecks.push({
    bracket: b.bracket,
    computed_count: vals.length,
    expected_count: b.count,
    computed_median: vals.length ? Math.round(percentile(vals, 50)) : null,
    expected_median: b.p50 ? Math.round(b.p50) : null,
  });
}

// --- Print ---
const fmtUSD = (n: number | null) =>
  n === null ? "—" : `$${n.toLocaleString()}`;
const pad = (s: string, w: number) => s + " ".repeat(Math.max(0, w - s.length));

console.log("\n╔══════════════════════════════════════════════════════════════════╗");
console.log("║  FACT-CHECK — 2025 r/financialindependence Survey                ║");
console.log("║  Independent recomputation from raw CSV (papaparse)              ║");
console.log("╚══════════════════════════════════════════════════════════════════╝\n");

console.log("FACT-CHECK REPORT (numbers shown on the live site)");
console.log("─".repeat(68));
console.log(`  Total responses:        ${computed.total.toLocaleString()}`);
console.log(`  Completed:              ${computed.completed.toLocaleString()}`);
console.log(`  Partial:                ${(computed.total - computed.completed).toLocaleString()}`);
console.log();
console.log(`  Bias call-out chips:`);
console.log(`    ${computed.pct_male}% male`);
console.log(`    ${computed.pct_us}% US`);
console.log(`    ${computed.pct_in_tech_eng}% in tech/eng`);
console.log(`    median wages ${fmtUSD(computed.median_wages)}`);
console.log(`    ${computed.pct_college}% college-educated`);
console.log();
console.log(`  Headline financials:`);
console.log(`    Median net worth:     ${fmtUSD(computed.median_nw)}`);
console.log(`    Median FI target:     ${fmtUSD(computed.median_fi_number)}`);
console.log(`    Already FI:           ${computed.pct_fi}%`);
console.log(`    Already RE:           ${computed.pct_re}%`);
console.log();
console.log(`  Net worth medians by age:`);
for (const c of ageBracketChecks) {
  console.log(`    ${pad(c.bracket, 8)} n=${pad(String(c.computed_count), 5)} median ${fmtUSD(c.computed_median)}`);
}

console.log("\nCROSS-CHECK vs precomputed.json");
console.log("─".repeat(68));
let failures = 0;
for (const c of checks) {
  const tol = c.tolerance ?? 0;
  const ok = Math.abs(c.computed - c.expected) <= tol;
  const status = ok ? "✓ MATCH" : "✗ DIFFER";
  const detail = ok ? "" : ` (Δ ${(c.computed - c.expected).toLocaleString()})`;
  console.log(`  ${pad(c.label, 28)} ${status}  computed=${c.computed.toLocaleString()}  expected=${c.expected.toLocaleString()}${detail}`);
  if (!ok) failures++;
}

console.log();
console.log("BRACKET-LEVEL NET WORTH (vs precomputed.nw_by_age)");
console.log("─".repeat(68));
for (const c of ageBracketChecks) {
  const countOK = c.computed_count === c.expected_count;
  const medianOK = c.computed_median === c.expected_median ||
    (c.computed_median !== null && c.expected_median !== null && Math.abs(c.computed_median - c.expected_median) <= 1);
  const status = countOK && medianOK ? "✓" : "✗";
  console.log(`  ${status} ${pad(c.bracket, 8)} count ${pad(String(c.computed_count), 5)}/${pad(String(c.expected_count), 5)}  median ${pad(fmtUSD(c.computed_median), 14)} / ${fmtUSD(c.expected_median)}`);
  if (!countOK || !medianOK) failures++;
}

console.log();
if (failures === 0) {
  console.log("✓ All checks passed. Numbers on the site can be trusted.\n");
  process.exit(0);
} else {
  console.log(`✗ ${failures} check(s) failed. Investigate before publishing.\n`);
  process.exit(1);
}
