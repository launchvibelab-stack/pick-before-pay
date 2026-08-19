"use client";

import type { Banner } from "@/lib/banner";
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
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [errMsg, setErrMsg] = useState("");
  const [dismissed, setDismissed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Hydration-safe: mark when component mounts
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

  // expired or disabled or dismissed
  const expired = banner.expires_at ? (timeLeft === null && mounted) : false;
  if (!banner.enabled || expired || dismissed) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    setErrMsg("");
    try {
      const r = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim() })
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setStatus("error");
        setErrMsg(j.error || "Please try again.");
        return;
      }
      setStatus("ok");
    } catch {
      setStatus("error");
      setErrMsg("Network error. Please try again.");
    }
  }

  const showCountdown = Boolean(banner.expires_at && timeLeft);
  const hasImage = Boolean(banner.image_url);
  const ctaLabel = banner.discount_code ? "Get discount" : "Get exclusive bonus";
  const positionLabel = "Exclusive for PickBeforePay readers";

  return (
    <div className="promo-banner" role="region" aria-label="Special offer">
      <div className="promo-banner-inner container">
        {/* Left: image */}
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

        {/* Center: text + countdown */}
        <div className="promo-banner-body">
          <p className="promo-position-label">{positionLabel}</p>
          {banner.product_name && (
            <p className="promo-banner-name">
              <span className="promo-fire">🔥</span> {banner.product_name}
            </p>
          )}
          {banner.description && (
            <p className="promo-banner-desc">{banner.description}</p>
          )}

          {showCountdown && timeLeft && (
            <div className="promo-countdown" aria-label="Time remaining">
              {timeLeft.days > 0 && (
                <span className="promo-unit">
                  <b>{pad(timeLeft.days)}</b><small>d</small>
                </span>
              )}
              <span className="promo-unit">
                <b>{pad(timeLeft.hours)}</b><small>h</small>
              </span>
              <span className="promo-unit">
                <b>{pad(timeLeft.minutes)}</b><small>m</small>
              </span>
              <span className="promo-unit">
                <b>{pad(timeLeft.seconds)}</b><small>s</small>
              </span>
            </div>
          )}
        </div>

        {/* Right: form or success */}
        <div className="promo-banner-cta">
          {status === "ok" ? (
            <div className="promo-success">
              <span className="promo-success-check">✓</span>
              <span>You&rsquo;re in!</span>
              {banner.discount_code && (
                <span className="promo-code">
                  Use code&nbsp;<b>{banner.discount_code}</b>
                </span>
              )}
              {banner.cta_url && (
                <a
                  href={banner.cta_url}
                  className="promo-cta-btn"
                  rel="nofollow noopener"
                  target="_blank"
                >
                  {banner.discount_code ? "Grab the deal →" : "Claim your bonus →"}
                </a>
              )}
            </div>
          ) : (
            <form className="promo-form" onSubmit={handleSubmit}>
              <input
                type="email"
                required
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={status === "loading"}
                autoComplete="email"
              />
              <button type="submit" className="promo-cta-btn" disabled={status === "loading"}>
                {status === "loading" ? "…" : ctaLabel}
              </button>
              {status === "error" && (
                <p className="promo-error">{errMsg}</p>
              )}
            </form>
          )}
        </div>
      </div>

      {/* Dismiss button */}
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
