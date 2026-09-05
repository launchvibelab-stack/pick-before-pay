"use client";

import { countdownLabelText, type Banner } from "@/lib/banner";
import { useEffect, useRef, useState } from "react";

type TimeLeft = { days: number; hours: number; minutes: number; seconds: number };

function calcTimeLeft(expiresAt: string): TimeLeft | null {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return null;
  const totalSecs = Math.floor(diff / 1000);
  return {
    days: Math.floor(totalSecs / 86400),
    hours: Math.floor((totalSecs % 86400) / 3600),
    minutes: Math.floor((totalSecs % 3600) / 60),
    seconds: totalSecs % 60
  };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function PromoBanner({ banner }: { banner: Banner }) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(
    banner.expires_at ? calcTimeLeft(banner.expires_at) : null
  );
  const [dismissed, setDismissed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!banner.expires_at) return;
    timerRef.current = setInterval(() => {
      const t = calcTimeLeft(banner.expires_at!);
      setTimeLeft(t);
      if (!t) clearInterval(timerRef.current!);
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [banner.expires_at]);

  const expired = banner.expires_at ? timeLeft === null && mounted : false;
  if (!banner.enabled || expired || dismissed || !banner.cta_url) return null;

  const showCountdown = Boolean(banner.expires_at && timeLeft);
  const hasImage = Boolean(banner.image_url);
  const ctaLabel = banner.discount_code ? "Get the deal →" : "Claim exclusive bonus →";
  const positionLabel =
    banner.label_variant === "featured_launch"
      ? "Featured Launch"
      : banner.label_variant === "partner_spotlight"
        ? "Partner Spotlight"
        : "Exclusive for PickBeforePay readers";

  return (
    <div className="promo-banner" role="region" aria-label="Special offer">
      <div className="promo-banner-inner container">
        {hasImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={banner.image_url!}
            alt={banner.product_name}
            className="promo-banner-img"
            loading="eager"
            decoding="async"
          />
        )}

        <div className="promo-banner-body">
          <p className="promo-position-label">{positionLabel}</p>
          {banner.product_name && (
            <p className="promo-banner-name">
              <span className="promo-fire">🔥</span> {banner.product_name}
            </p>
          )}
          {banner.description && <p className="promo-banner-desc">{banner.description}</p>}

          {showCountdown && timeLeft && (
            <div className="promo-countdown-row">
              <span className="promo-countdown-label">{countdownLabelText(banner.countdown_label)}</span>
              <div className="promo-countdown" aria-label={countdownLabelText(banner.countdown_label)}>
                {timeLeft.days > 0 && (
                  <span className="promo-unit">
                    <b>{pad(timeLeft.days)}</b>
                    <small>d</small>
                  </span>
                )}
                <span className="promo-unit">
                  <b>{pad(timeLeft.hours)}</b>
                  <small>h</small>
                </span>
                <span className="promo-unit">
                  <b>{pad(timeLeft.minutes)}</b>
                  <small>m</small>
                </span>
                <span className="promo-unit">
                  <b>{pad(timeLeft.seconds)}</b>
                  <small>s</small>
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="promo-banner-cta">
          <a
            href={banner.cta_url}
            className="promo-cta-btn promo-cta-btn-lg"
            rel="nofollow sponsored noopener"
            target="_blank"
          >
            {ctaLabel}
          </a>
        </div>
      </div>

      <button
        type="button"
        className="promo-dismiss"
        onClick={() => setDismissed(true)}
        aria-label="Close banner"
      >
        ✕
      </button>
    </div>
  );
}
