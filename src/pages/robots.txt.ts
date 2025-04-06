import type { APIRoute } from "astro";

export const GET: APIRoute = ({ site }) => {
  // Make sure site is defined
  if (!site) {
    throw new Error("Site URL is undefined");
  }

  // Base URL for the site
  const baseUrl = site.toString().replace(/\/$/, "");

  // Generate robots.txt content
  const robotsTxt = `# robots.txt file for plumbernearme.shop
User-agent: *
Allow: /

# Sitemaps
Sitemap: ${baseUrl}/sitemap.xml
`;

  // Return the content with appropriate content type
  return new Response(robotsTxt, {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
    },
  });
};
