// Utility functions for working with plumber data

// Import types based on our data structure
export interface Plumber {
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
  popularTimes?: Record<string, any>;
  latitude?: number;
  longitude?: number;
  images?: Array<{ title: string; image: string }>;
  reviews?: Array<{
    Name: string;
    ProfilePicture: string;
    Rating: number;
    Description: string;
    Images: string[] | null;
    When: string;
  }>;
  review_summary?: string;
  thumbnail?: string;
  [key: string]: any;
}

/**
 * Get plumbers by state
 */
export function getPlumbersByState(
  plumbers: Plumber[],
  state: string
): Plumber[] {
  return plumbers.filter(
    (plumber) =>
      plumber.state && plumber.state.toLowerCase() === state.toLowerCase()
  );
}

/**
 * Get plumbers by city
 */
export function getPlumbersByCity(
  plumbers: Plumber[],
  city: string,
  state?: string
): Plumber[] {
  return plumbers.filter(
    (plumber) =>
      plumber.city &&
      plumber.city.toLowerCase() === city.toLowerCase() &&
      (!state ||
        (plumber.state && plumber.state.toLowerCase() === state.toLowerCase()))
  );
}

/**
 * Get a plumber by slug
 */
export function getPlumberBySlug(
  plumbers: Plumber[],
  slug: string
): Plumber | undefined {
  return plumbers.find((plumber) => plumber.slug === slug);
}

/**
 * Get unique states from plumbers
 */
export function getUniqueStates(plumbers: Plumber[]): string[] {
  const states = new Set<string>();

  plumbers.forEach((plumber) => {
    if (plumber.state) {
      states.add(plumber.state);
    }
  });

  return Array.from(states).sort();
}

/**
 * Get unique cities by state
 */
export function getUniqueStatesCities(
  plumbers: Plumber[]
): Record<string, string[]> {
  const statesCities: Record<string, Set<string>> = {};

  plumbers.forEach((plumber) => {
    if (plumber.state && plumber.city) {
      if (!statesCities[plumber.state]) {
        statesCities[plumber.state] = new Set<string>();
      }

      statesCities[plumber.state].add(plumber.city);
    }
  });

  // Convert Sets to sorted arrays
  const result: Record<string, string[]> = {};

  Object.keys(statesCities).forEach((state) => {
    result[state] = Array.from(statesCities[state]).sort();
  });

  return result;
}

/**
 * Get plumbers without location data
 */
export function getPlumbersWithoutLocation(plumbers: Plumber[]): Plumber[] {
  return plumbers.filter(
    (plumber) => !plumber.city && !plumber.state && !plumber.address
  );
}

/**
 * Sort plumbers by rating (highest first)
 */
export function sortPlumbersByRating(plumbers: Plumber[]): Plumber[] {
  return [...plumbers].sort((a, b) => {
    const ratingA = a.rating || 0;
    const ratingB = b.rating || 0;

    if (ratingA === ratingB) {
      // If ratings are the same, sort by review count
      const reviewCountA = a.reviewCount || 0;
      const reviewCountB = b.reviewCount || 0;
      return reviewCountB - reviewCountA;
    }

    return ratingB - ratingA;
  });
}

/**
 * Format a readable address from the plumber data
 */
export function formatAddress(plumber: Plumber): string {
  if (plumber.address) {
    return plumber.address;
  }

  const parts = [];
  if (plumber.city) parts.push(plumber.city);
  if (plumber.state) parts.push(plumber.state);

  return parts.join(", ");
}

/**
 * Get a formatted list of categories from the plumber data
 */
export function formatCategories(plumber: Plumber): string {
  if (plumber.categories && plumber.categories.length > 0) {
    return plumber.categories.join(", ");
  }

  return plumber.category || "Plumber";
}

/**
 * Check if a plumber is open now based on hours data
 */
export function isOpenNow(plumber: Plumber): boolean | null {
  if (!plumber.hours) return null;

  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const now = new Date();
  const dayName = days[now.getDay()];

  // Check if the plumber has hours for the current day
  if (!plumber.hours[dayName] || plumber.hours[dayName].length === 0) {
    return false; // Closed today
  }

  // Check for "Open 24 hours"
  if (plumber.hours[dayName].includes("Open 24 hours")) {
    return true;
  }

  // Parse hour strings like "8 AM–6 PM"
  for (const hourStr of plumber.hours[dayName]) {
    const match = hourStr.match(
      /(\d+)(?:\s*[：:]\s*(\d+))?\s*([APap][Mm])(?:\s*[–-]\s*(\d+)(?:\s*[：:]\s*(\d+))?\s*([APap][Mm]))?/
    );

    if (!match) continue;

    const [
      _,
      openHour,
      openMinute = "0",
      openAmPm,
      closeHour,
      closeMinute = "0",
      closeAmPm,
    ] = match;

    // Convert to 24-hour format
    let openHour24 = parseInt(openHour);
    if (openAmPm.toLowerCase() === "pm" && openHour24 < 12) openHour24 += 12;
    if (openAmPm.toLowerCase() === "am" && openHour24 === 12) openHour24 = 0;

    let closeHour24 = parseInt(closeHour || "0");
    if (closeAmPm && closeAmPm.toLowerCase() === "pm" && closeHour24 < 12)
      closeHour24 += 12;
    if (closeAmPm && closeAmPm.toLowerCase() === "am" && closeHour24 === 12)
      closeHour24 = 0;

    // Current hour and minute
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Compare times
    const openTime = openHour24 * 60 + parseInt(openMinute);
    const closeTime = closeHour24 * 60 + parseInt(closeMinute);
    const currentTime = currentHour * 60 + currentMinute;

    if (openTime <= currentTime && currentTime <= closeTime) {
      return true; // Open now
    }
  }

  return false; // Not open now
}

/**
 * Format the hours for display
 */
export function formatHours(plumber: Plumber): Record<string, string> {
  if (!plumber.hours) return {};

  const formattedHours: Record<string, string> = {};

  Object.keys(plumber.hours).forEach((day) => {
    formattedHours[day] = plumber.hours![day].join(", ");
  });

  return formattedHours;
}

/**
 * Paginate an array of items
 */
export function paginate<T>(
  items: T[],
  page: number,
  perPage: number
): {
  items: T[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
} {
  const startIndex = (page - 1) * perPage;
  const endIndex = startIndex + perPage;
  const paginatedItems = items.slice(startIndex, endIndex);

  return {
    items: paginatedItems,
    totalItems: items.length,
    totalPages: Math.ceil(items.length / perPage),
    currentPage: page,
  };
}
