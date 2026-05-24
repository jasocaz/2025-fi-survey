import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------------------------------------------------------------------
// Fixed currency → USD conversion rates (approximate, for display only)
// ---------------------------------------------------------------------------
const FX: Record<string, number> = {
  USD: 1.0,
  CAD: 0.73,
  EUR: 1.08,
  GBP: 1.27,
  AUD: 0.66,
  CHF: 1.12,
  SGD: 0.74,
  PLN: 0.25,
  CZK: 0.043,
};

function fxRate(currency: string): number {
  const ticker = currency.replace(/[^A-Z]/g, "").slice(0, 3);
  return FX[ticker] ?? 1.0;
}

function regionFromCurrency(currency: string): string {
  const c = currency.toUpperCase();
  if (c.includes("USD") || c.includes("UNITED STATES")) return "US";
  if (c.includes("CAD") || c.includes("CANADIAN")) return "CA";
  if (c.includes("EUR") || c.includes("EURO") || c.includes("GBP") || c.includes("POUND") ||
    c.includes("CHF") || c.includes("PLN") || c.includes("CZK") || c.includes("POLISH") ||
    c.includes("CZECH")) return "EU";
  return "APAC_OTHER";
}

// ---------------------------------------------------------------------------
// CSV parsing (hand-rolled — avoid runtime dep on Node 24 for papaparse)
// ---------------------------------------------------------------------------
function parseCSV(raw: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuote = false;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (ch === '"') {
      if (inQuote && raw[i + 1] === '"') { cell += '"'; i++; }
      else inQuote = !inQuote;
    } else if (ch === ',' && !inQuote) {
      row.push(cell); cell = "";
    } else if ((ch === '\n' || ch === '\r') && !inQuote) {
      if (ch === '\r' && raw[i + 1] === '\n') i++;
      row.push(cell); cell = "";
      rows.push(row); row = [];
    } else {
      cell += ch;
    }
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

function toNum(s: string): number | null {
  if (!s || !s.trim()) return null;
  const n = parseFloat(s.replace(/[$,\s]/g, ""));
  return isNaN(n) ? null : n;
}

function toBool(s: string): boolean | null {
  if (!s) return null;
  return s.trim().toLowerCase() === "yes";
}

function toMulti(s: string): string[] {
  if (!s || !s.trim()) return [];
  return s.split(",").map((x) => x.trim()).filter(Boolean);
}

// Normalise macro-impact values to short tokens
function normImpact(s: string): string[] {
  return toMulti(s).map((v) => {
    const l = v.toLowerCase();
    if (l.includes("no change")) return "no_change";
    if (l.includes("increased my fi") || l.includes("increased my re number")) return "inc_num";
    if (l.includes("decreased my fi") || l.includes("decreased my re number")) return "dec_num";
    if (l.includes("increased my planned")) return "inc_date";
    if (l.includes("decreased my planned")) return "dec_date";
    return "other";
  }).filter((v, i, a) => a.indexOf(v) === i); // dedupe
}

function normWithdrawal(less: string, right: string, more: string): "less" | "right" | "more" | null {
  if (less) return "less";
  if (right) return "right";
  if (more) return "more";
  return null;
}

// ---------------------------------------------------------------------------
// Percentile helpers
// ---------------------------------------------------------------------------
function percentile(sorted: number[], p: number): number {
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

function buildPercentileTable(values: number[]): Record<string, number> {
  const sorted = [...values].sort((a, b) => a - b);
  const result: Record<string, number> = {};
  for (let p = 5; p <= 95; p += 5) result[`p${p}`] = percentile(sorted, p);
  result["p1"] = percentile(sorted, 1);
  result["p99"] = percentile(sorted, 99);
  result["median"] = percentile(sorted, 50);
  result["count"] = sorted.length;
  return result;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
const CSV_PATH = path.join(__dirname, "../data/raw/responses.csv");
const OUT_RESPONSES = path.join(__dirname, "../src/app/data/responses.json");
const OUT_PRECOMPUTED = path.join(__dirname, "../src/app/data/precomputed.json");

const raw = fs.readFileSync(CSV_PATH, "utf8");
const rows = parseCSV(raw);
const header = rows[0];
const dataRows = rows.slice(1);

// Map header index — find by keyword
function col(keyword: string | string[]): number {
  const kws = Array.isArray(keyword) ? keyword : [keyword];
  const idx = header.findIndex((h) =>
    kws.every((k) => h.toLowerCase().includes(k.toLowerCase()))
  );
  if (idx === -1) throw new Error(`Column not found for keywords: ${kws.join(", ")}`);
  return idx;
}

// Pre-map column indices once
const COLS = {
  status: col("response status"),
  contributors: col("how many individuals contribute"),
  in_us: col("reside in the united states"),
  currency: col("what currency"),
  political_slider: col("political views"),
  race: col(["race", "ethnicity", "select all"]),
  gender: col(["what is your gender"]),
  age: col(["what is your age"]),
  relationship: col(["what is your relationship status"]),
  parental: col(["which of the following describes you"]),
  num_children: col(["how many children do you have"]),
  employment_ft: col(["current employment status", "full time"]),
  // Hard-coded from data exploration (cols 28-30 are the primary respondent's work fields)
  industry: 28,
  employer_type: 29,
  role: 30,
  education: col(["highest level of education you"]),
  housing: col(["current housing situation"]),
  col_bracket: col(["cost of living index"]),
  is_fi: col(["are you financially independent"]),
  fi_number: col(["amount invested will you consider yourself financially independent"]),
  pct_to_fi: col(["percent of your financial independence number"]),
  is_re: col(["are you retired"]),
  re_number: col(["amount invested do you intend to retire"]),
  target_swr: col(["target safe withdrawal rate"]),
  supp_gov: col(["government retirement"]),
  supp_pension: col(["employer pension"]),
  supp_rental: col(["income from rental"]),
  supp_inheritance: col(["inheritance"]),
  max_supp_income: col(["highest amount of annual income you expect"]),
  retirement_spend: col(["how much money", "expect to spend each year once"]),
  fi_flavor: col(["which of the following are you seeking"]),
  stop_working: col(["intend to stop working for money"]),
  retire_age: col(["at what age do you intend to retire"]),
  impact_climate: col(["climate change"]),
  impact_inflation: col(["inflation"]),
  impact_political: col(["political instability"]),
  impact_tech: col(["technology advancements"]),
  impact_personal: col(["personal circumstances"]),
  fi_number_at_fi: col(["amount invested did you consider yourself financially independent"]),
  re_target_at_re: col(["which of the following were you targeting at the time"]),
  re_number_at_re: col(["amount invested did you retire"]),
  actual_swr: col(["annual withdrawal rate this year"]),
  actual_withdrawal: col(["annual withdrawal dollar amount"]),
  withdrawal_less: col(["characterizes your withdrawals", "less than"]),
  withdrawal_right: col(["characterizes your withdrawals", "right around"]),
  withdrawal_more: col(["characterizes your withdrawals", "more than"]),
  // Assets (col 85-93)
  asset_residence: col(["asset value", "primary residence"]),
  asset_taxable: col(["asset value", "brokerage"]),
  asset_retirement: col(["asset value", "retirement accounts"]),
  asset_cash: col(["asset value", "cash"]),
  asset_dedicated: col(["asset value", "dedicated savings"]),
  asset_speculative: col(["asset value", "speculative"]),
  asset_properties: col(["asset value", "investment properties"]),
  asset_other: col(["asset value", "other"]),
  asset_total: col(["asset value", "total sum"]),
  // Debts
  debt_student: col(["debt amounts", "student"]),
  debt_mortgage: col(["debt amounts", "mortgage"]),
  debt_auto: col(["debt amounts", "auto"]),
  debt_cards: col(["debt amounts", "credit cards"]),
  debt_medical: col(["debt amounts", "medical"]),
  debt_properties: col(["debt amounts", "investment properties"]),
  debt_other: col(["debt amounts", "other"]),
  debt_total: col(["debt amounts", "total sum"]),
  // Expenses
  exp_uncategorized: col(["annual expenses", "don't categorize"]),
  exp_housing: col(["annual expenses", "housing (rent"]),
  exp_utilities: col(["annual expenses", "utilities"]),
  exp_transport: col(["annual expenses", "transportation"]),
  exp_necessities: col(["annual expenses", "necessities"]),
  exp_luxuries: col(["annual expenses", "luxuries"]),
  exp_children: col(["annual expenses", "children"]),
  exp_debt: col(["annual expenses", "debt repayment"]),
  exp_tax_adv: col(["annual expenses", "tax advantaged investments"]),
  exp_non_tax_adv: col(["annual expenses", "non-tax advantaged"]),
  exp_charity: col(["annual expenses", "charity"]),
  exp_healthcare: col(["annual expenses", "healthcare"]),
  exp_taxes: col(["annual expenses", "taxes (all taxes"]),
  exp_education: col(["annual expenses", "education"]),
  exp_business: col(["annual expenses", "business"]),
  exp_other: col(["annual expenses", "other"]),
  exp_total: col(["annual expenses", "total sum"]),
  // Income
  inc_wages: col(["annual pre-tax income", "wages"]),
  inc_self: col(["annual pre-tax income", "self-employment"]),
  inc_rental: col(["annual pre-tax income", "rental"]),
  inc_employer: col(["annual pre-tax income", "employer matches"]),
  inc_cap_gains: col(["annual pre-tax income", "capital gains"]),
  inc_other: col(["annual pre-tax income", "other"]),
  inc_total: col(["annual pre-tax income", "total sum"]),
};


const responses: unknown[] = [];
let numFI = 0, numRE = 0;
const nwValues: number[] = [];
const fiNumValues: number[] = [];

for (let i = 0; i < dataRows.length; i++) {
  const r = dataRows[i];
  const get = (idx: number) => (r[idx] ?? "").trim();

  const currency = get(COLS.currency);
  const fx = fxRate(currency);
  const inUSD = currency.includes("United States") || currency.includes("USD");
  const region = inUSD ? "US" : regionFromCurrency(currency);

  const numUSD = (idx: number) => {
    const v = toNum(get(idx));
    return v !== null ? { native: v, usd: Math.round(v * fx) } : null;
  };
  const numScalarUSD = (idx: number): number | null => {
    const v = numUSD(idx);
    return v?.usd ?? null;
  };

  const isRE = toBool(get(COLS.is_re));
  const isFI = toBool(get(COLS.is_fi));
  if (isFI) numFI++;
  if (isRE) numRE++;

  const assetTotal = numScalarUSD(COLS.asset_total);
  if (assetTotal !== null) nwValues.push(assetTotal);
  const fiNum = numScalarUSD(COLS.fi_number);
  if (fiNum !== null) fiNumValues.push(fiNum);

  const pctToFI = toNum(get(COLS.pct_to_fi));
  // clamp values > 100 as likely data-entry errors (value was entered as percent not decimal)
  const pctToFIClean = pctToFI !== null && pctToFI > 100 ? null : pctToFI;

  const targetSWR = toNum(get(COLS.target_swr));
  // clamp implausible SWR (>15 probably means entered as 4.0 vs 4 vs 0.04)
  const targetSWRClean = targetSWR !== null && targetSWR > 15 ? null : targetSWR;

  const response = {
    id: String(i),
    status: get(COLS.status) === "COMPLETED" ? "COMPLETED" : "PARTIAL",
    contributors: Math.min(3, parseInt(get(COLS.contributors)) || 1) as 1 | 2 | 3,
    in_us: toBool(get(COLS.in_us)),
    currency,
    region,
    fx_rate: fx,
    political_slider: toNum(get(COLS.political_slider)),
    // demographics
    race: toMulti(get(COLS.race)),
    gender: get(COLS.gender) || null,
    age_bracket: get(COLS.age) || null,
    relationship: get(COLS.relationship) || null,
    parental: get(COLS.parental) || null,
    num_children: toNum(get(COLS.num_children)),
    // work
    industry: get(COLS.industry) || null,
    employer_type: get(COLS.employer_type) || null,
    role: get(COLS.role) || null,
    education: get(COLS.education) || null,
    // geo / housing
    housing: get(COLS.housing) || null,
    col_bracket: get(COLS.col_bracket) || null,
    // FI plan
    is_fi: isFI,
    fi_number: fiNum,
    pct_to_fi: pctToFIClean,
    is_re: isRE,
    re_number: numScalarUSD(COLS.re_number),
    target_swr: targetSWRClean,
    expected_supplemental_income: numScalarUSD(COLS.max_supp_income),
    expected_retirement_spend: numScalarUSD(COLS.retirement_spend),
    fi_flavor: get(COLS.fi_flavor) || null,
    stop_working_at_fi: get(COLS.stop_working) || null,
    target_retire_age_bracket: get(COLS.retire_age) || null,
    supp_gov: get(COLS.supp_gov) || null,
    supp_pension: get(COLS.supp_pension) || null,
    supp_rental: get(COLS.supp_rental) || null,
    supp_inheritance: get(COLS.supp_inheritance) || null,
    // already FI/RE
    fi_number_at_fi: numScalarUSD(COLS.fi_number_at_fi),
    re_number_at_re: numScalarUSD(COLS.re_number_at_re),
    actual_swr: toNum(get(COLS.actual_swr)),
    actual_withdrawal: numScalarUSD(COLS.actual_withdrawal),
    withdrawal_vs_plan: normWithdrawal(get(COLS.withdrawal_less), get(COLS.withdrawal_right), get(COLS.withdrawal_more)),
    // macro impacts
    impact_climate: normImpact(get(COLS.impact_climate)),
    impact_inflation: normImpact(get(COLS.impact_inflation)),
    impact_political: normImpact(get(COLS.impact_political)),
    impact_tech: normImpact(get(COLS.impact_tech)),
    impact_personal: normImpact(get(COLS.impact_personal)),
    // assets (USD)
    assets: {
      primary_residence: numScalarUSD(COLS.asset_residence),
      taxable: numScalarUSD(COLS.asset_taxable),
      retirement: numScalarUSD(COLS.asset_retirement),
      cash: numScalarUSD(COLS.asset_cash),
      dedicated_savings: numScalarUSD(COLS.asset_dedicated),
      speculative: numScalarUSD(COLS.asset_speculative),
      properties: numScalarUSD(COLS.asset_properties),
      other: numScalarUSD(COLS.asset_other),
      total: assetTotal,
    },
    // debts (USD)
    debts: {
      student: numScalarUSD(COLS.debt_student),
      mortgage: numScalarUSD(COLS.debt_mortgage),
      auto: numScalarUSD(COLS.debt_auto),
      cards: numScalarUSD(COLS.debt_cards),
      medical: numScalarUSD(COLS.debt_medical),
      properties: numScalarUSD(COLS.debt_properties),
      other: numScalarUSD(COLS.debt_other),
      total: numScalarUSD(COLS.debt_total),
    },
    // income (USD)
    income: {
      wages: numScalarUSD(COLS.inc_wages),
      self_emp: numScalarUSD(COLS.inc_self),
      rental: numScalarUSD(COLS.inc_rental),
      employer_match: numScalarUSD(COLS.inc_employer),
      cap_gains: numScalarUSD(COLS.inc_cap_gains),
      other: numScalarUSD(COLS.inc_other),
      total: numScalarUSD(COLS.inc_total),
    },
    // expenses (USD)
    expenses: {
      uncategorized: numScalarUSD(COLS.exp_uncategorized),
      housing: numScalarUSD(COLS.exp_housing),
      utilities: numScalarUSD(COLS.exp_utilities),
      transport: numScalarUSD(COLS.exp_transport),
      necessities: numScalarUSD(COLS.exp_necessities),
      luxuries: numScalarUSD(COLS.exp_luxuries),
      children: numScalarUSD(COLS.exp_children),
      debt: numScalarUSD(COLS.exp_debt),
      tax_adv_inv: numScalarUSD(COLS.exp_tax_adv),
      non_tax_adv_sav: numScalarUSD(COLS.exp_non_tax_adv),
      charity: numScalarUSD(COLS.exp_charity),
      healthcare: numScalarUSD(COLS.exp_healthcare),
      taxes: numScalarUSD(COLS.exp_taxes),
      education: numScalarUSD(COLS.exp_education),
      business: numScalarUSD(COLS.exp_business),
      other: numScalarUSD(COLS.exp_other),
      total: numScalarUSD(COLS.exp_total),
    },
  };
  responses.push(response);
}

// ---------------------------------------------------------------------------
// Precomputed stats
// ---------------------------------------------------------------------------
nwValues.sort((a, b) => a - b);
fiNumValues.sort((a, b) => a - b);

const AGE_BRACKETS = ["21-25", "26-30", "31-35", "36-40", "41-45", "46-50", "51-55", "56-60", "61-65", "66-70"];

function nwByAge(rows: typeof responses) {
  return AGE_BRACKETS.map((bracket) => {
    const vals = (rows as {age_bracket: string | null; assets: {total: number | null}}[])
      .filter((r) => r.age_bracket === bracket && r.assets.total !== null)
      .map((r) => r.assets.total as number)
      .sort((a, b) => a - b);
    if (!vals.length) return { bracket, count: 0, p25: null, p50: null, p75: null, p90: null };
    return {
      bracket,
      count: vals.length,
      p25: percentile(vals, 25),
      p50: percentile(vals, 50),
      p75: percentile(vals, 75),
      p90: percentile(vals, 90),
    };
  });
}

const typedResponses = responses as {
  is_fi: boolean | null;
  is_re: boolean | null;
  fi_flavor: string | null;
  target_swr: number | null;
  age_bracket: string | null;
  assets: { total: number | null };
  debts: { total: number | null };
  income: { total: number | null };
  expenses: { total: number | null };
}[];

// Demographic stats (used by the bias call-out and OG description)
const demoTyped = responses as {
  gender: string | null;
  in_us: boolean | null;
  industry: string | null;
  education: string | null;
  income: { wages: number | null };
}[];
const pctOf = (count: number) => Math.round((count / responses.length) * 100);
const numMale = demoTyped.filter((r) => r.gender === "Male").length;
const numUS = demoTyped.filter((r) => r.in_us === true).length;
const numInTech = demoTyped.filter((r) => r.industry?.includes("Information Technology")).length;
const numCollege = demoTyped.filter((r) => {
  const e = r.education ?? "";
  return e.includes("Bachelor") || e.includes("Master") || e.includes("Doctorate");
}).length;
const wagesValues = demoTyped
  .map((r) => r.income.wages)
  .filter((v): v is number => v !== null && v > 0)
  .sort((a, b) => a - b);
const medianWages = wagesValues.length ? Math.round(percentile(wagesValues, 50)) : null;

const precomputed = {
  total: responses.length,
  completed: responses.filter((r) => (r as {status: string}).status === "COMPLETED").length,
  num_fi: numFI,
  num_re: numRE,
  pct_fi: Math.round((numFI / responses.length) * 100),
  pct_re: Math.round((numRE / responses.length) * 100),
  median_nw: nwValues.length ? Math.round(percentile(nwValues, 50)) : null,
  median_fi_number: fiNumValues.length ? Math.round(percentile(fiNumValues, 50)) : null,
  // Demographic snapshot
  pct_male: pctOf(numMale),
  pct_us: pctOf(numUS),
  pct_in_tech: pctOf(numInTech),
  pct_college: pctOf(numCollege),
  median_wages: medianWages,
  nw_percentile_table: buildPercentileTable(nwValues),
  nw_by_age: nwByAge(responses),
  fi_flavor_counts: Object.fromEntries(
    ["FI", "ChubbyFI", "LeanFI", "FatFI", "Barista / Coast FI", "Undecided"].map((f) => [
      f,
      typedResponses.filter((r) => r.fi_flavor === f).length,
    ])
  ),
  swr_distribution: (() => {
    const vals = typedResponses.map((r) => r.target_swr).filter((v): v is number => v !== null && v > 0 && v <= 10);
    const buckets: Record<string, number> = {};
    vals.forEach((v) => {
      const bucket = (Math.round(v * 4) / 4).toFixed(2);
      buckets[bucket] = (buckets[bucket] ?? 0) + 1;
    });
    return buckets;
  })(),
};

// Write outputs
fs.writeFileSync(OUT_RESPONSES, JSON.stringify(responses));
fs.writeFileSync(OUT_PRECOMPUTED, JSON.stringify(precomputed, null, 2));

const responsesSize = Buffer.byteLength(JSON.stringify(responses)) / 1024 / 1024;
const precomputedSize = Buffer.byteLength(JSON.stringify(precomputed)) / 1024;

console.log("✓ build-data complete");
console.log(`  responses.json   ${responsesSize.toFixed(2)} MB  (${responses.length} rows)`);
console.log(`  precomputed.json ${precomputedSize.toFixed(1)} KB`);
console.log(`  FI: ${numFI} (${Math.round(numFI / responses.length * 100)}%)  RE: ${numRE}`);
console.log(`  Median NW: $${(precomputed.median_nw ?? 0).toLocaleString()}`);
console.log(`  Median FI target: $${(precomputed.median_fi_number ?? 0).toLocaleString()}`);
