// @ts-check
import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";

// https://astro.build/config
export default defineConfig({
  site: "https://plumbernearme.shop",
  integrations: [tailwind()],
  output: "static",
  build: {
    // Split large site into smaller chunks to stay within Cloudflare Pages limits
    format: "directory",
    assets: "assets",
    inlineStylesheets: "never",
  },
  compressHTML: true,
  prefetch: {
    prefetchAll: false,
    defaultStrategy: "hover",
  },
  experimental: {
    clientPrerender: true,
  },
});
