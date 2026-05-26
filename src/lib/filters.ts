import type { Filters, SurveyResponse } from "./types";
import { HHI_BRACKETS } from "./types";

export function applyFilters(rows: SurveyResponse[], filters: Filters): SurveyResponse[] {
  const selectedHhi = filters.hhi.length > 0
    ? HHI_BRACKETS.filter((b) => filters.hhi.includes(b.value))
    : null;
  return rows.filter((r) => {
    if (filters.geo !== "all" && r.region !== filters.geo) return false;
    if (filters.fi_status === "pursuing" && (r.is_fi || r.is_re)) return false;
    if (filters.fi_status === "fi" && !r.is_fi) return false;
    if (filters.fi_status === "re" && !r.is_re) return false;
    if (filters.flavors.length > 0 && !filters.flavors.includes(r.fi_flavor ?? "")) return false;
    if (filters.age_brackets.length > 0 && !filters.age_brackets.includes(r.age_bracket ?? "")) return false;
    if (filters.household === "single" && r.contributors !== 1) return false;
    if (filters.household === "dual" && r.contributors < 2) return false;
    if (selectedHhi) {
      const total = r.income.total;
      if (total === null) return false;
      const inAny = selectedHhi.some(
        (b) => total >= b.min && (b.max === null || total < b.max)
      );
      if (!inAny) return false;
    }
    return true;
  });
}

export function filtersToParams(filters: Filters): URLSearchParams {
  const p = new URLSearchParams();
  if (filters.geo !== "all") p.set("geo", filters.geo);
  if (filters.fi_status !== "all") p.set("fi", filters.fi_status);
  if (filters.flavors.length) p.set("flavors", filters.flavors.join(","));
  if (filters.age_brackets.length) p.set("ages", filters.age_brackets.join(","));
  if (filters.household !== "all") p.set("hh", filters.household);
  if (filters.hhi.length) p.set("hhi", filters.hhi.join(","));
  return p;
}

export function paramsToFilters(params: URLSearchParams): Filters {
  return {
    geo: (params.get("geo") as Filters["geo"]) || "all",
    fi_status: (params.get("fi") as Filters["fi_status"]) || "all",
    flavors: params.get("flavors")?.split(",").filter(Boolean) ?? [],
    age_brackets: params.get("ages")?.split(",").filter(Boolean) ?? [],
    household: (params.get("hh") as Filters["household"]) || "all",
    hhi: params.get("hhi")?.split(",").filter(Boolean) ?? [],
  };
}
