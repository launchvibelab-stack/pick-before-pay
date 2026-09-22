import Script from "next/script";

/**
 * Loads one shared gtag.js for GA4 and/or Google Ads.
 * Avoids duplicating the full Google tag snippet on the page.
 */
export function GoogleAnalytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || "";
  const adsId =
    process.env.NEXT_PUBLIC_GOOGLE_ADS_ID?.trim() || "AW-18467111836";
  const primaryId = gaId || adsId;
  if (!primaryId) return null;

  const configLines = [
    gaId ? `gtag('config', '${gaId}', { anonymize_ip: true });` : "",
    adsId ? `gtag('config', '${adsId}');` : ""
  ]
    .filter(Boolean)
    .join("\n          ");

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${primaryId}`}
        strategy="afterInteractive"
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          ${configLines}
        `}
      </Script>
    </>
  );
}
