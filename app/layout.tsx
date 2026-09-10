import type { Metadata } from "next";
import { Outfit, Newsreader } from "next/font/google";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { GoogleAnalyticsPageviews } from "@/components/GoogleAnalyticsPageviews";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  preload: true
});

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-serif",
  style: ["italic"],
  weight: ["500"],
  display: "swap",
  preload: false
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://pickbeforepay.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "PickBeforePay - Honest product reviews",
    template: "%s | PickBeforePay"
  },
  description: "In-depth niche reviews to help you choose the right tools and products before you buy.",
  icons: {
    icon: [
      { url: "/icon-p2.png", type: "image/png", sizes: "512x512" },
      { url: "/favicon-p2.ico", sizes: "any" }
    ],
    apple: [{ url: "/apple-touch-icon-p2.png", sizes: "180x180" }],
    shortcut: "/icon-p2.png"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${outfit.variable} ${newsreader.variable}`}>
      <body>
        <GoogleAnalytics />
        <GoogleAnalyticsPageviews />
        {children}
      </body>
    </html>
  );
}
