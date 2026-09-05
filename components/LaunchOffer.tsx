"use client";

import { countdownLabelText, type Banner } from "@/lib/banner";
import { englishRequiredEmailProps } from "@/lib/formValidation";
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

export function LaunchOffer({ banner }: { banner: Banner }) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(
    banner.expires_at ? calcTimeLeft(banner.expires_at) : null
  );
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [errMsg, setErrMsg] = useState("");
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
  if (!banner.enabled || expired) {
    return (
      <div className="launch-ended">
        <h1>This offer has ended</h1>
        <p>Browse our latest reviews while we prepare the next launch.</p>
        <a href="/" className="primary-btn">
          Browse reviews
        </a>
      </div>
    );
  }

  const showCountdown = Boolean(banner.expires_at && timeLeft);
  const hasDiscount = Boolean(banner.discount_code);
  const submitLabel = hasDiscount ? "Get my discount" : "Get exclusive bonus";
  const positionLabel =
    banner.label_variant === "featured_launch"
      ? "Featured Launch"
      : banner.label_variant === "partner_spotlight"
        ? "Partner Spotlight"
        : "Exclusive for PickBeforePay readers";

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

  return (
    <div className="launch-card">
      <p className="promo-position-label">{positionLabel}</p>

      {banner.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={banner.image_url}
          alt={banner.product_name}
          className="launch-img"
          loading="eager"
          decoding="async"
        />
      )}

      <h1 className="launch-title">{banner.product_name || "Exclusive offer"}</h1>
      {banner.description && <p className="launch-desc">{banner.description}</p>}

      {showCountdown && timeLeft && (
        <div className="promo-countdown-row launch-countdown">
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

      {status === "ok" ? (
        <div className="launch-success">
          <span className="promo-success-check">✓</span>
          <p>You&rsquo;re in! Check your inbox.</p>
          {banner.discount_code && (
            <div className="promo-code launch-code">
              Your code: <strong>{banner.discount_code}</strong>
            </div>
          )}
          {banner.cta_url && (
            <a
              href={banner.cta_url}
              className="promo-cta-btn promo-cta-btn-lg"
              rel="nofollow sponsored noopener"
              target="_blank"
            >
              {hasDiscount ? "Grab the deal →" : "Claim your bonus →"}
            </a>
          )}
        </div>
      ) : (
        <form className="launch-form" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={status === "loading"}
            autoComplete="email"
            {...englishRequiredEmailProps()}
          />
          <button type="submit" className="promo-cta-btn promo-cta-btn-lg" disabled={status === "loading"}>
            {status === "loading" ? "…" : submitLabel}
          </button>
          {status === "error" && <p className="promo-error">{errMsg}</p>}
          <p className="launch-hint">No spam. Unsubscribe anytime.</p>
        </form>
      )}

      {banner.review_url && (
        <a href={banner.review_url} className="launch-review-link">
          Prefer to read the full review first →
        </a>
      )}
    </div>
  );
}
