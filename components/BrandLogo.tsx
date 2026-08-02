"use client";

import Image from "next/image";

export function BrandLogo({ size = 32 }: { size?: number }) {
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
        src="/logo-mark.png"
        alt="PickBeforePay"
        width={size}
        height={size}
        className="brand-logo"
        priority
        sizes={`${size}px`}
      />
      <span>Pick</span>
      <b>BeforePay</b>
    </a>
  );
}
