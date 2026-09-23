"use client";

import { useEffect } from "react";

const SEND_TO =
  process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_SEND_TO?.trim() ||
  "AW-18467111836/Y7UECMWU-4EdEJyH5-VE";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    gtag_report_conversion?: (url?: string) => boolean;
  }
}

function isAffiliateOutbound(anchor: HTMLAnchorElement) {
  const href = anchor.getAttribute("href") || "";
  const rel = (anchor.getAttribute("rel") || "").toLowerCase();
  if (href.startsWith("/api/go/")) return true;
  if (rel.includes("sponsored")) return true;
  return false;
}

/**
 * Fires Google Ads click-conversion when users hit affiliate / sponsored CTAs.
 * Does not block navigation (works with target=_blank).
 */
export function AdsConversionClicks() {
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const target = e.target;
      if (!(target instanceof Element)) return;
      const a = target.closest("a");
      if (!(a instanceof HTMLAnchorElement)) return;
      if (!isAffiliateOutbound(a)) return;
      if (typeof window.gtag !== "function") return;

      window.gtag("event", "conversion", { send_to: SEND_TO });
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
