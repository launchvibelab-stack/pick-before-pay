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
  async headers() {
    const headers: {
      source: string;
      headers: { key: string; value: string }[];
    }[] = [
      {
        source: "/logo-mark.:ext(png|webp)",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }]
      },
      {
        source: "/logo-full.:ext(png|webp)",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }]
      },
      {
        source: "/:path(favicon.ico|icon.png|apple-touch-icon.png|logo.png)",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }]
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
