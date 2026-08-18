"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function GaRouteListener() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const id = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();

  useEffect(() => {
    if (!id || typeof window.gtag !== "function") return;
    const qs = searchParams?.toString();
    const page_path = qs ? `${pathname}?${qs}` : pathname;
    window.gtag("config", id, { page_path });
  }, [id, pathname, searchParams]);

  return null;
}

/** Send virtual pageviews on client navigations (App Router). */
export function GoogleAnalyticsPageviews() {
  if (!process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim()) return null;
  return (
    <Suspense fallback={null}>
      <GaRouteListener />
    </Suspense>
  );
}
