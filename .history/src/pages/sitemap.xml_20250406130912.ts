import type { APIRoute } from "astro";
import {
  getAllStates,
  getStateBySlug,
  loadPlumberData,
} from "../utils/dataUtils";

export const GET: APIRoute = async ({ site }) => {
  // Make sure site is defined
  if (!site) {
    throw new Error("Site URL is undefined");
  }

  // Base URL for the site
  const baseUrl = site.toString().replace(/\/$/, "");

  // Start with static pages
  const staticPages = [
    "",
    "about",
    "contact",
    "privacy-policy",
    "terms-of-service",
    "plumber",
    "state",
  ].map((page) => ({
    url: `${baseUrl}/${page}`,
    lastmod: new Date().toISOString().split("T")[0],
  }));

  // Add state pages
  const states = await getAllStates();
  const statePages = states.map((state) => ({
    url: `${baseUrl}/state/${state.slug}`,
    lastmod: new Date().toISOString().split("T")[0],
  }));

  // Add ALL city pages (removed the slice limitation)
  const cityPages = [];
  for (const state of states) {
    const allCities = state.cities.sort(
      (a, b) => b.plumberCount - a.plumberCount
    );

    for (const city of allCities) {
      cityPages.push({
        url: `${baseUrl}/state/${state.slug}/${city.slug}`,
        lastmod: new Date().toISOString().split("T")[0],
      });
    }
  }

  // Add ALL plumber pages (removed the slice limitation)
  const allPlumbers = await loadPlumberData();
  const plumberPages = allPlumbers.map((plumber) => ({
    url: `${baseUrl}/plumber/${plumber.slug}`,
    lastmod: new Date().toISOString().split("T")[0],
  }));

  // Combine all pages
  const allPages = [
    ...staticPages,
    ...statePages,
    ...cityPages,
    ...plumberPages,
  ];

  // Generate sitemap XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages
  .map(
    (page) => `  <url>
    <loc>${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${
      page.url.includes("/plumber/") ? "monthly" : "weekly"
    }</changefreq>
    <priority>${getPriority(page.url)}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

  // Return the XML with appropriate content type
  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml",
    },
  });
};

// Helper function to determine priority based on URL
function getPriority(url: string): string {
  if (url.endsWith("/")) return "1.0";
  if (url.includes("/state/") && !url.match(/\/state\/[^\/]+\/[^\/]+/))
    return "0.9";
  if (url.match(/\/state\/[^\/]+\/[^\/]+/)) return "0.8";
  if (url.includes("/plumber/")) return "0.7";
  return "0.5";
}
