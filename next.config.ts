import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components: caching is opted into per function/component via the
  // `use cache` directive, and the route is served as a prerendered static
  // shell with dynamic content streaming in (Partial Prerendering).
  cacheComponents: true,
  images: {
    // Allow TMDB poster images to be served through the Next.js image
    // optimizer. Scoped to the poster path prefix per the next/image docs.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
        port: "",
        pathname: "/t/p/**",
        search: "",
      },
    ],
  },
};

export default nextConfig;
