/**
 * Design tokens for chart components.
 *
 * The brand surfaces (backgrounds, text, borders) live in `globals.css` as
 * CSS custom properties — use Tailwind classes (`bg-brand`, `text-slate-600`)
 * for those. This file is the runtime source of truth for charts whose
 * libraries (Recharts, custom SVGs) need literal color values.
 *
 * Keep these in sync with globals.css :root values.
 */

export const BRAND = {
  green: "#0E9F6E", // primary accent
  greenDark: "#0A8657",
  greenLight: "#3DDB9A",
  greenSoft: "#E6F7F0",
  greenDeep: "#04432D",

  navy: "#0A2540",
  navyDeep: "#011936",
} as const;

export const SLATE = {
  "025": "#F6F9FC",
  "050": "#E3E8EE",
  "100": "#C1CCDD",
  "200": "#ADBDCC",
  "300": "#8898AA",
  "400": "#6B7C93",
  "500": "#525F7F",
  "600": "#425466",
  "700": "#2A3A55",
  "800": "#1A2C42",
  "900": "#0A2540",
} as const;

/** Chart-specific tokens — paired with chart parts (gridlines, axis labels). */
export const CHART = {
  axisLabel: SLATE[300],
  axisTitle: SLATE[400],
  gridline: SLATE["050"],
  gridlineDashed: "3 4",
  refLineMuted: SLATE[200],
  /** Default bar fill — single-series ranked / histogram bars. */
  primary: BRAND.green,
  primaryMuted: BRAND.greenLight,
  /** Tinted band (e.g. p25–p75 of a whisker). */
  band: "rgba(14, 159, 110, 0.22)",
  bandOuter: "rgba(14, 159, 110, 0.10)",
  /** Highlight used for the visitor's own value. */
  visitor: BRAND.greenDark,
  /** Tooltip border + bg. */
  tooltipBg: "#ffffff",
  tooltipBorder: SLATE["050"],
} as const;

/** Categorical palette for multi-series breakdowns (donuts, stacked bars).
 *  Ordered light → dark; use first N entries for N categories.            */
export const CATEGORICAL = [
  BRAND.green,
  BRAND.greenLight,
  "#5FCFA0",
  "#A9E4C7",
  SLATE[700],
  "#FED703", // warm amber accent for the outlier slot
  "#FF8A65", // soft coral for negative / outlier-2
  SLATE[300],
] as const;

/** Asset / expense category color maps — semantic, stable across components. */
export const ASSET_COLORS: Record<string, string> = {
  Retirement: BRAND.green,
  Taxable: BRAND.greenLight,
  "Primary Home": BRAND.greenDeep,
  Cash: "#A9E4C7",
  Other: SLATE[200],
};

export const DEBT_COLORS: Record<string, string> = {
  Mortgage: BRAND.greenDeep,
  "Student loans": BRAND.green,
  Auto: BRAND.greenLight,
  "Credit cards": "#A9E4C7",
  Medical: "#FED703",
  Other: SLATE[200],
};

export const FLAVOR_COLORS: Record<string, string> = {
  FI: BRAND.green,
  ChubbyFI: BRAND.greenLight,
  "Barista / Coast FI": "#A9E4C7",
  FatFI: "#FED703",
  LeanFI: "#FF8A65",
  Undecided: SLATE[300],
};

export const EXPENSE_COLORS: Record<string, string> = {
  Housing: BRAND.greenDeep,
  Taxes: BRAND.green,
  "Tax-adv inv.": "#2E9E68",
  Savings: BRAND.greenLight,
  Luxuries: "#8CCBAD",
  Necessities: "#A9E4C7",
  Transport: "#D6EEDF",
  Healthcare: "#FED703",
  Utilities: "#F4C544",
  Children: "#FF8A65",
  Charity: "#FFAA80",
  "Debt repayment": SLATE[300],
};

export const INCOME_COLORS: Record<string, string> = {
  Wages: BRAND.greenDeep,
  "Employer match/ESPP": BRAND.green,
  "Cap gains/dividends": BRAND.greenLight,
  "Rental/business": "#A9E4C7",
  "Self-employment": "#FED703",
  Other: SLATE[300],
};

/** Semantic colors for diverging "raised it / lowered it" bars. */
export const DIVERGING = {
  raised: "#DF5A6B", // soft red
  lowered: BRAND.green,
  neutral: SLATE[300],
} as const;
