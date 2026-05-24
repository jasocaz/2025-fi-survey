export type Region = "US" | "CA" | "EU" | "APAC_OTHER";

export interface Assets {
  primary_residence: number | null;
  taxable: number | null;
  retirement: number | null;
  cash: number | null;
  dedicated_savings: number | null;
  speculative: number | null;
  properties: number | null;
  other: number | null;
  total: number | null;
}

export interface Debts {
  student: number | null;
  mortgage: number | null;
  auto: number | null;
  cards: number | null;
  medical: number | null;
  properties: number | null;
  other: number | null;
  total: number | null;
}

export interface Income {
  wages: number | null;
  self_emp: number | null;
  rental: number | null;
  employer_match: number | null;
  cap_gains: number | null;
  other: number | null;
  total: number | null;
}

export interface Expenses {
  uncategorized: number | null;
  housing: number | null;
  utilities: number | null;
  transport: number | null;
  necessities: number | null;
  luxuries: number | null;
  children: number | null;
  debt: number | null;
  tax_adv_inv: number | null;
  non_tax_adv_sav: number | null;
  charity: number | null;
  healthcare: number | null;
  taxes: number | null;
  education: number | null;
  business: number | null;
  other: number | null;
  total: number | null;
}

export interface SurveyResponse {
  id: string;
  status: "COMPLETED" | "PARTIAL";
  contributors: 1 | 2 | 3;
  in_us: boolean | null;
  currency: string;
  region: Region;
  fx_rate: number;
  political_slider: number | null;
  race: string[];
  gender: string | null;
  age_bracket: string | null;
  relationship: string | null;
  parental: string | null;
  num_children: number | null;
  industry: string | null;
  employer_type: string | null;
  role: string | null;
  education: string | null;
  housing: string | null;
  col_bracket: string | null;
  is_fi: boolean | null;
  fi_number: number | null;
  pct_to_fi: number | null;
  is_re: boolean | null;
  re_number: number | null;
  target_swr: number | null;
  expected_supplemental_income: number | null;
  expected_retirement_spend: number | null;
  fi_flavor: string | null;
  stop_working_at_fi: string | null;
  target_retire_age_bracket: string | null;
  supp_gov: string | null;
  supp_pension: string | null;
  supp_rental: string | null;
  supp_inheritance: string | null;
  fi_number_at_fi: number | null;
  re_number_at_re: number | null;
  actual_swr: number | null;
  actual_withdrawal: number | null;
  withdrawal_vs_plan: "less" | "right" | "more" | null;
  impact_climate: string[];
  impact_inflation: string[];
  impact_political: string[];
  impact_tech: string[];
  impact_personal: string[];
  assets: Assets;
  debts: Debts;
  income: Income;
  expenses: Expenses;
}

export interface Precomputed {
  total: number;
  completed: number;
  num_fi: number;
  num_re: number;
  pct_fi: number;
  pct_re: number;
  median_nw: number | null;
  median_fi_number: number | null;
  pct_male: number;
  pct_us: number;
  pct_in_tech: number;
  pct_college: number;
  median_wages: number | null;
  nw_percentile_table: Record<string, number>;
  nw_by_age: Array<{
    bracket: string;
    count: number;
    p25: number | null;
    p50: number | null;
    p75: number | null;
    p90: number | null;
  }>;
  fi_flavor_counts: Record<string, number>;
  swr_distribution: Record<string, number>;
}

export interface Filters {
  geo: "all" | "US" | "CA" | "EU" | "APAC_OTHER";
  fi_status: "all" | "pursuing" | "fi" | "re";
  flavors: string[];
  age_brackets: string[];
  household: "all" | "single" | "dual";
}

export const DEFAULT_FILTERS: Filters = {
  geo: "all",
  fi_status: "all",
  flavors: [],
  age_brackets: [],
  household: "all",
};

export const AGE_BRACKETS = [
  "21-25","26-30","31-35","36-40","41-45",
  "46-50","51-55","56-60","61-65","66-70",
];

export const FI_FLAVORS = ["FI","ChubbyFI","LeanFI","FatFI","Barista / Coast FI","Undecided"];
