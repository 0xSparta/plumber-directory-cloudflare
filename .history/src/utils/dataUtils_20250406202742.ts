// Data processing utilities for plumber directory

export interface PlumberData {
  id: number;
  slug: string;
  title: string;
  category: string;
  categories: string[];
  address?: string;
  city?: string;
  state?: string;
  rating?: number;
  reviewCount?: number;
  price?: string;
  description?: string;
  website?: string;
  phone?: string;
  hours?: Record<string, string[]>;
  latitude?: number;
  longitude?: number;
  images?: { title: string; image: string }[];
  reviews?: any[];
  thumbnail?: string;
  [key: string]: any;
}

export interface StateData {
  name: string;
  slug: string;
  plumberCount: number;
  cities: CityData[];
}

export interface CityData {
  name: string;
  slug: string;
  state: string;
  stateSlug: string;
  plumberCount: number;
}

// In-memory cache for plumber data
let plumberDataCache: PlumberData[] | null = null;
let stateDataCache: StateData[] | null = null;

// Load and process data from the JSON files
export async function loadPlumberData(): Promise<PlumberData[]> {
  // Return cached data if available to reduce memory usage and improve performance
  if (plumberDataCache) {
    return plumberDataCache;
  }

  try {
    // In production, we'll use the full dataset
    const { default: data } = await import(
      "../data/plumber-usa-results-astro.json"
    );
    plumberDataCache = data as PlumberData[];
    return plumberDataCache;
  } catch (error) {
    // Fallback to sample data if the main file fails to load
    try {
      const { default: sampleData } = await import(
        "../data/plumber-usa-results-astro-sample.json"
      );
      plumberDataCache = sampleData as PlumberData[];
      return plumberDataCache;
    } catch (innerError) {
      console.error("Failed to load plumber data:", innerError);
      return [];
    }
  }
}

// Get plumber by slug - more efficient for SSR
export async function getPlumberBySlug(
  slug: string
): Promise<PlumberData | null> {
  // In an ideal implementation, we'd load only the specific plumber by slug
  // rather than the entire dataset. For now, we'll still load the full data
  // but we've enabled SSR so it only happens on demand.
  const plumbers = await loadPlumberData();
  return plumbers.find((plumber) => plumber.slug === slug) || null;
}

// Get all states with plumbers - with caching for efficiency
export async function getAllStates(): Promise<StateData[]> {
  // Return cached state data if available
  if (stateDataCache) {
    return stateDataCache;
  }

  const plumbers = await loadPlumberData();

  // Group plumbers by state
  const stateMap = new Map<string, PlumberData[]>();

  plumbers.forEach((plumber) => {
    if (plumber.state) {
      const stateSlug = slugify(plumber.state);
      if (!stateMap.has(stateSlug)) {
        stateMap.set(stateSlug, []);
      }
      stateMap.get(stateSlug)!.push(plumber);
    }
  });

  // Convert map to array of StateData objects
  const states: StateData[] = [];

  for (const [stateSlug, statePlumbers] of stateMap.entries()) {
    // Create city data for this state
    const cityMap = new Map<string, PlumberData[]>();

    statePlumbers.forEach((plumber) => {
      if (plumber.city) {
        const citySlug = slugify(plumber.city);
        if (!cityMap.has(citySlug)) {
          cityMap.set(citySlug, []);
        }
        cityMap.get(citySlug)!.push(plumber);
      }
    });

    const cities: CityData[] = [];

    for (const [citySlug, cityPlumbers] of cityMap.entries()) {
      cities.push({
        name: cityPlumbers[0].city!,
        slug: citySlug,
        state: statePlumbers[0].state!,
        stateSlug,
        plumberCount: cityPlumbers.length,
      });
    }

    states.push({
      name: statePlumbers[0].state!,
      slug: stateSlug,
      plumberCount: statePlumbers.length,
      cities,
    });
  }

  // Sort states alphabetically
  stateDataCache = states.sort((a, b) => a.name.localeCompare(b.name));
  return stateDataCache;
}

// Get state by slug
export async function getStateBySlug(slug: string): Promise<StateData | null> {
  const states = await getAllStates();
  return states.find((state) => state.slug === slug) || null;
}

// Get all cities in a state
export async function getCitiesInState(stateSlug: string): Promise<CityData[]> {
  const state = await getStateBySlug(stateSlug);
  return state?.cities || [];
}

// Get city data
export async function getCityBySlug(
  stateSlug: string,
  citySlug: string
): Promise<CityData | null> {
  const cities = await getCitiesInState(stateSlug);
  return cities.find((city) => city.slug === citySlug) || null;
}

// Get plumbers in a city
export async function getPlumbersInCity(
  stateSlug: string,
  citySlug: string
): Promise<PlumberData[]> {
  const plumbers = await loadPlumberData();
  return plumbers.filter(
    (plumber) =>
      plumber.state &&
      plumber.city &&
      slugify(plumber.state) === stateSlug &&
      slugify(plumber.city) === citySlug
  );
}

// Get plumbers in a state
export async function getPlumbersInState(
  stateSlug: string
): Promise<PlumberData[]> {
  const plumbers = await loadPlumberData();
  return plumbers.filter(
    (plumber) => plumber.state && slugify(plumber.state) === stateSlug
  );
}

// Get plumbers without location
export async function getPlumbersWithoutLocation(): Promise<PlumberData[]> {
  const plumbers = await loadPlumberData();
  return plumbers.filter((plumber) => !plumber.state || !plumber.city);
}

// Helper: Convert string to URL-friendly slug
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

// Helper: Get top rated plumbers
export async function getTopRatedPlumbers(
  limit: number = 10
): Promise<PlumberData[]> {
  const plumbers = await loadPlumberData();
  return plumbers
    .filter(
      (plumber) =>
        plumber.rating && plumber.reviewCount && plumber.reviewCount > 5
    )
    .sort((a, b) => {
      // Sort by rating and then by number of reviews
      if (b.rating! !== a.rating!) {
        return b.rating! - a.rating!;
      }
      return b.reviewCount! - a.reviewCount!;
    })
    .slice(0, limit);
}

// Helper: Get most reviewed plumbers
export async function getMostReviewedPlumbers(
  limit: number = 10
): Promise<PlumberData[]> {
  const plumbers = await loadPlumberData();
  return plumbers
    .filter((plumber) => plumber.reviewCount)
    .sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0))
    .slice(0, limit);
}
