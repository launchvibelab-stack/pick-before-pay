/**
 * One shared gtag for GA4 + Google Ads, rendered as real <script> tags in <head>
 * so Google Ads' "check tag" tool can see AW-... in the HTML source.
 */
export function GoogleAnalytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || "";
  const adsId =
    process.env.NEXT_PUBLIC_GOOGLE_ADS_ID?.trim() || "AW-18467111836";
  // Prefer Ads ID in the loader URL — Ads installer looks for id=AW-...
  const scriptId = adsId || gaId;
  if (!scriptId) return null;

  const conversionSendTo =
    process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_SEND_TO?.trim() ||
    "AW-18467111836/Y7UECMWU-4EdEJyH5-VE";

  const configLines = [
    gaId ? `gtag('config', '${gaId}', { anonymize_ip: true });` : "",
    adsId ? `gtag('config', '${adsId}');` : ""
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-sync-scripts */}
      <script async src={`https://www.googletagmanager.com/gtag/js?id=${scriptId}`} />
      <script
        id="gtag-init"
        dangerouslySetInnerHTML={{
          __html: `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
${configLines}
function gtag_report_conversion(url) {
  var callback = function () {
    if (typeof(url) != 'undefined') {
      window.location = url;
    }
  };
  gtag('event', 'conversion', {
    'send_to': '${conversionSendTo}',
    'event_callback': callback
  });
  return false;
}
`
        }}
      />
    </>
  );
}
