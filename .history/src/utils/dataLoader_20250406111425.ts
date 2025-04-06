// Data loader utility to efficiently handle the large plumber dataset
import type { Plumber } from "./plumbers";
import plumberData from "../data/plumber-usa-results-astro.json";
import { getUniqueStates, getUniqueStatesCities } from "./plumbers";

// Cache for expensive operations
let statesCache: string[] | null = null;
let statesCitiesCache: Record<string, string[]> | null = null;
let slugMapCache: Map<string, Plumber> | null = null;

/**
 * Get all plumbers from the dataset
 */
export function getAllPlumbers(): Plumber[] {
  return plumberData as Plumber[];
}

/**
 * Get a map of all plumbers by slug
 */
export function getPlumbersBySlugMap(): Map<string, Plumber> {
  if (slugMapCache) {
    return slugMapCache;
  }

  const plumbers = getAllPlumbers();
  const slugMap = new Map<string, Plumber>();

  plumbers.forEach((plumber) => {
    if (plumber.slug) {
      slugMap.set(plumber.slug, plumber);
    }
  });

  slugMapCache = slugMap;
  return slugMap;
}

/**
 * Get a single plumber by slug
 */
export function getPlumberBySlug(slug: string): Plumber | undefined {
  const slugMap = getPlumbersBySlugMap();
  return slugMap.get(slug);
}

/**
 * Get all states with plumbers
 */
export function getAllStates(): string[] {
  if (statesCache) {
    return statesCache;
  }

  const plumbers = getAllPlumbers();
  const states = getUniqueStates(plumbers);

  statesCache = states;
  return states;
}

/**
 * Get all cities by state
 */
export function getAllStatesCities(): Record<string, string[]> {
  if (statesCitiesCache) {
    return statesCitiesCache;
  }

  const plumbers = getAllPlumbers();
  const statesCities = getUniqueStatesCities(plumbers);

  statesCitiesCache = statesCities;
  return statesCities;
}

/**
 * Get plumbers for a specific state
 */
export function getPlumbersForState(state: string): Plumber[] {
  const plumbers = getAllPlumbers();
  return plumbers.filter(
    (p) => p.state && p.state.toLowerCase() === state.toLowerCase()
  );
}

/**
 * Get plumbers for a specific city
 */
export function getPlumbersForCity(city: string, state?: string): Plumber[] {
  const plumbers = getAllPlumbers();
  return plumbers.filter(
    (p) =>
      p.city &&
      p.city.toLowerCase() === city.toLowerCase() &&
      (!state || (p.state && p.state.toLowerCase() === state.toLowerCase()))
  );
}

/**
 * Get plumbers without location information
 */
export function getPlumbersWithoutLocation(): Plumber[] {
  const plumbers = getAllPlumbers();
  return plumbers.filter((p) => !p.city && !p.state && !p.address);
}

/**
 * Search plumbers by name/title
 */
export function searchPlumbers(query: string): Plumber[] {
  if (!query) return [];

  const normalizedQuery = query.toLowerCase();
  const plumbers = getAllPlumbers();

  return plumbers.filter(
    (p) => p.title && p.title.toLowerCase().includes(normalizedQuery)
  );
}
