import type { EnrichmentResult } from "./types";

const safeJsonParse = <T,>(val: string | null, fallback: T): T => {
  if (!val) return fallback;
  try {
    return JSON.parse(val) as T;
  } catch {
    return fallback;
  }
};

// Notes
export const getNote = (companyId: string) =>
  localStorage.getItem(`vc_note_${companyId}`) ?? "";

export const setNote = (companyId: string, note: string) =>
  localStorage.setItem(`vc_note_${companyId}`, note);

// Lists
export type VCList = { id: string; name: string; companyIds: string[] };

export const getLists = (): VCList[] =>
  safeJsonParse(localStorage.getItem("vc_lists"), []);

export const saveLists = (lists: VCList[]) =>
  localStorage.setItem("vc_lists", JSON.stringify(lists));

// Saved searches
export type SavedSearch = { id: string; name: string; queryString: string };

export const getSavedSearches = (): SavedSearch[] =>
  safeJsonParse(localStorage.getItem("vc_saved_searches"), []);

export const saveSavedSearches = (items: SavedSearch[]) =>
  localStorage.setItem("vc_saved_searches", JSON.stringify(items));

// Enrichment cache
// Enrichment cache
type EnrichCache = { result: EnrichmentResult; cachedAt: string };

export const getEnrichCache = (companyId: string): EnrichCache | null => {
  const raw = localStorage.getItem(`vc_enrich_${companyId}`);
  return safeJsonParse<EnrichCache | null>(raw, null);
};

export const setEnrichCache = (companyId: string, result: EnrichmentResult) => {
  const payload: EnrichCache = { result, cachedAt: new Date().toISOString() };
  localStorage.setItem(`vc_enrich_${companyId}`, JSON.stringify(payload));
};
// ---------- Custom Companies (localStorage) ----------
const CUSTOM_COMPANIES_KEY = "vc_custom_companies";

export function getCustomCompanies() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CUSTOM_COMPANIES_KEY);
    const arr = raw ? JSON.parse(raw) : [];

    if (!Array.isArray(arr)) return [];

    // keep only valid items that have id + name + website
    return arr.filter(
      (x: any) =>
        x &&
        typeof x === "object" &&
        typeof x.id === "string" &&
        typeof x.name === "string" &&
        typeof x.website === "string"
    );
  } catch {
    return [];
  }
}

export function saveCustomCompanies(companies: any[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CUSTOM_COMPANIES_KEY, JSON.stringify(companies));
}
