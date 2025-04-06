// SEO utilities for plumber directory

interface SEOProps {
  title: string;
  description: string;
  canonicalUrl?: string;
  ogImage?: string;
  type?: "website" | "article";
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
    author?: string;
    tags?: string[];
  };
  noIndex?: boolean;
}

export function generateMetaTags(props: SEOProps): { [key: string]: string } {
  const {
    title,
    description,
    canonicalUrl,
    ogImage = "/images/default-og-image.jpg",
    type = "website",
    article,
    noIndex,
  } = props;

  const siteName = "Plumber Near Me";
  const siteUrl = "https://plumbernearme.shop";
  const defaultDescription =
    "Find reliable plumbers near you. Plumber Near Me is your directory for plumbing services across the USA.";

  const tags: { [key: string]: string } = {
    // Basic tags
    title: `${title} | ${siteName}`,
    description: description || defaultDescription,

    // Open Graph tags
    "og:title": title,
    "og:description": description || defaultDescription,
    "og:type": type,
    "og:site_name": siteName,
    "og:image": ogImage.startsWith("http") ? ogImage : `${siteUrl}${ogImage}`,

    // Twitter tags
    "twitter:card": "summary_large_image",
    "twitter:title": title,
    "twitter:description": description || defaultDescription,
    "twitter:image": ogImage.startsWith("http")
      ? ogImage
      : `${siteUrl}${ogImage}`,
  };

  // Add canonical URL if provided
  if (canonicalUrl) {
    tags["canonical"] = canonicalUrl.startsWith("http")
      ? canonicalUrl
      : `${siteUrl}${canonicalUrl}`;
  }

  // Add article-specific tags if type is 'article'
  if (type === "article" && article) {
    if (article.publishedTime) {
      tags["article:published_time"] = article.publishedTime;
    }

    if (article.modifiedTime) {
      tags["article:modified_time"] = article.modifiedTime;
    }

    if (article.author) {
      tags["article:author"] = article.author;
    }

    if (article.tags && article.tags.length > 0) {
      article.tags.forEach((tag, index) => {
        tags[`article:tag:${index}`] = tag;
      });
    }
  }

  // Add noindex directive if specified
  if (noIndex) {
    tags["robots"] = "noindex, nofollow";
  }

  return tags;
}

// Generate structured data for plumber
export function generatePlumberStructuredData(plumber: any): string {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `https://plumbernearme.shop/plumber/${plumber.slug}`,
    name: plumber.title,
    image:
      plumber.thumbnail ||
      (plumber.images && plumber.images.length > 0
        ? plumber.images[0].image
        : ""),
    priceRange: plumber.price || "$$",
    telephone: plumber.phone || "",
    url:
      plumber.website || `https://plumbernearme.shop/plumber/${plumber.slug}`,
    description:
      plumber.description || `${plumber.title} is a plumber service provider.`,
  };

  // Add address if available
  if (plumber.address) {
    structuredData["address"] = {
      "@type": "PostalAddress",
      streetAddress: plumber.address,
      addressLocality: plumber.city || "",
      addressRegion: plumber.state || "",
      addressCountry: "US",
    };
  }

  // Add geo coordinates if available
  if (plumber.latitude && plumber.longitude) {
    structuredData["geo"] = {
      "@type": "GeoCoordinates",
      latitude: plumber.latitude,
      longitude: plumber.longitude,
    };
  }

  // Add opening hours if available
  if (plumber.hours && Object.keys(plumber.hours).length > 0) {
    const openingHoursSpecification = [];
    const dayMapping: { [key: string]: string } = {
      Monday: "Mo",
      Tuesday: "Tu",
      Wednesday: "We",
      Thursday: "Th",
      Friday: "Fr",
      Saturday: "Sa",
      Sunday: "Su",
    };

    for (const [day, hours] of Object.entries(plumber.hours)) {
      if (Array.isArray(hours) && hours.length > 0) {
        const hourText = hours[0];

        // Parse hours like "8 AM–6 PM" or "Open 24 hours"
        if (hourText === "Open 24 hours") {
          openingHoursSpecification.push({
            "@type": "OpeningHoursSpecification",
            dayOfWeek: `https://schema.org/${dayMapping[day]}`,
            opens: "00:00",
            closes: "23:59",
          });
        } else if (hourText !== "Closed") {
          // Try to parse normal operating hours
          const match = hourText.match(
            /(\d+)\s*([APap][Mm])[\u2013\u2014-]\s*(\d+)\s*([APap][Mm])/
          );
          if (match) {
            const [_, openHour, openAmPm, closeHour, closeAmPm] = match;
            const opens = convertTo24Hour(
              parseInt(openHour),
              openAmPm.toUpperCase() === "PM"
            );
            const closes = convertTo24Hour(
              parseInt(closeHour),
              closeAmPm.toUpperCase() === "PM"
            );

            openingHoursSpecification.push({
              "@type": "OpeningHoursSpecification",
              dayOfWeek: `https://schema.org/${dayMapping[day]}`,
              opens: `${opens}:00`,
              closes: `${closes}:00`,
            });
          }
        }
      }
    }

    if (openingHoursSpecification.length > 0) {
      structuredData["openingHoursSpecification"] = openingHoursSpecification;
    }
  }

  // Add aggregateRating if available
  if (plumber.rating && plumber.reviewCount) {
    structuredData["aggregateRating"] = {
      "@type": "AggregateRating",
      ratingValue: plumber.rating,
      reviewCount: plumber.reviewCount,
    };
  }

  // Add reviews if available
  if (plumber.reviews && plumber.reviews.length > 0) {
    structuredData["review"] = plumber.reviews
      .slice(0, 5)
      .map((review: any) => ({
        "@type": "Review",
        author: {
          "@type": "Person",
          name: review.Name,
        },
        reviewRating: {
          "@type": "Rating",
          ratingValue: review.Rating,
        },
        reviewBody: review.Description,
      }));
  }

  return JSON.stringify(structuredData);
}

// Generate local business structured data for state/city pages
export function generateLocalBusinessListStructuredData(
  plumbers: any[],
  location: string
): string {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: plumbers.slice(0, 10).map((plumber, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "LocalBusiness",
        name: plumber.title,
        image:
          plumber.thumbnail ||
          (plumber.images && plumber.images.length > 0
            ? plumber.images[0].image
            : ""),
        telephone: plumber.phone || "",
        url: `https://plumbernearme.shop/plumber/${plumber.slug}`,
        address: plumber.address
          ? {
              "@type": "PostalAddress",
              streetAddress: plumber.address,
              addressLocality: plumber.city || "",
              addressRegion: plumber.state || "",
              addressCountry: "US",
            }
          : undefined,
        aggregateRating:
          plumber.rating && plumber.reviewCount
            ? {
                "@type": "AggregateRating",
                ratingValue: plumber.rating,
                reviewCount: plumber.reviewCount,
              }
            : undefined,
      },
    })),
  };

  return JSON.stringify(structuredData);
}

// Utility function to convert 12-hour time to 24-hour format
function convertTo24Hour(hour: number, isPM: boolean): number {
  if (isPM && hour < 12) {
    return hour + 12;
  }
  if (!isPM && hour === 12) {
    return 0;
  }
  return hour;
}

// Generate breadcrumb structured data
export function generateBreadcrumbStructuredData(
  items: { name: string; url: string }[]
): string {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http")
        ? item.url
        : `https://plumbernearme.shop${item.url}`,
    })),
  };

  return JSON.stringify(structuredData);
}
