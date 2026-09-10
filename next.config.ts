import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  // Avoid picking parent lockfile as Turbopack root (slows / mis-resolves builds)
  turbopack: {
    root: path.join(__dirname)
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [{ protocol: "https", hostname: "**" }]
  },
  experimental: {
    optimizePackageImports: ["lucide-react"]
  },
  async rewrites() {
    // Serve the transparent P mark at the classic path Google still crawls.
    return [{ source: "/favicon.ico", destination: "/favicon-p2.ico" }];
  },
  async headers() {
    const headers: {
      source: string;
      headers: { key: string; value: string }[];
    }[] = [
      {
        source: "/logo-full.:ext(png|webp)",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }]
      },
      {
        source: "/logo-wordmark.:ext(png|webp)",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }]
      },
      {
        // Google + browsers keep /favicon.ico forever; force revalidation.
        source: "/favicon.ico",
        headers: [{ key: "Cache-Control", value: "public, max-age=0, must-revalidate" }]
      },
      {
        source:
          "/:path(favicon-p.ico|favicon-p2.ico|icon.png|icon-p.png|icon-p2.png|apple-touch-icon.png|apple-touch-icon-p.png|apple-touch-icon-p2.png|logo.png|logo-mark.png|logo-mark.webp)",
        headers: [{ key: "Cache-Control", value: "public, max-age=3600, must-revalidate" }]
      }
    ];

    // Affirm indexing for review posts (helps clear stale GSC "noindex" after publish).
    if (process.env.VERCEL_ENV !== "preview") {
      headers.push({
        source: "/posts/:path*",
        headers: [{ key: "X-Robots-Tag", value: "index, follow" }]
      });
    }

    return headers;
  }
};

export default nextConfig;
