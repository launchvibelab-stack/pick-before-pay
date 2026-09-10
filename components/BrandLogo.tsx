"use client";

import Image from "next/image";

const LOGO_W = 168;
const LOGO_H = 32;

export function BrandLogo({ height = LOGO_H }: { size?: number; height?: number }) {
  const h = height;
  const w = Math.round((LOGO_W / LOGO_H) * h);

  function goHome(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    if (window.location.pathname === "/" && !window.location.hash) {
      window.location.reload();
      return;
    }
    window.location.assign("/");
  }

  return (
    <a href="/" className="brand" aria-label="PickBeforePay home" onClick={goHome}>
      <Image
        src="/logo-wordmark.png"
        alt="PickBeforePay"
        width={w}
        height={h}
        className="brand-logo"
        priority
        sizes={`${w}px`}
      />
    </a>
  );
}
