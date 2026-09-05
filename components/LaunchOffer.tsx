"use client";

import { MarkdownContent } from "@/components/MarkdownContent";
import { countdownLabelText, type Launch } from "@/lib/launch";
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

function positionLabelText(variant: Launch["label_variant"]) {
  if (variant === "featured_launch") return "Featured Launch";
  if (variant === "partner_spotlight") return "Partner Spotlight";
  return "Exclusive for PickBeforePay readers";
}

type FormStatus = "idle" | "loading" | "ok" | "error";

function EmailGate({
  offer,
  email,
  setEmail,
  status,
  setStatus,
  errMsg,
  setErrMsg,
  variant = "primary"
}: {
  offer: Launch;
  email: string;
  setEmail: (v: string) => void;
  status: FormStatus;
  setStatus: (s: FormStatus) => void;
  errMsg: string;
  setErrMsg: (m: string) => void;
  variant?: "primary" | "bottom";
}) {
  const hasDiscount = Boolean(offer.discount_code);
  const submitLabel = hasDiscount ? "Get my discount" : "Get exclusive access";

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

  if (status === "ok") {
    return (
      <div className={`launch-success ${variant === "bottom" ? "launch-success-bottom" : ""}`}>
        <span className="promo-success-check">✓</span>
        <p>You&rsquo;re in! Check your inbox.</p>
        {offer.discount_code && (
          <div className="promo-code launch-code">
            Your code: <strong>{offer.discount_code}</strong>
          </div>
        )}
        {offer.cta_url && (
          <a
            href={offer.cta_url}
            className="promo-cta-btn promo-cta-btn-lg"
            rel="nofollow sponsored noopener"
            target="_blank"
          >
            {hasDiscount ? "Grab the deal →" : "Claim your access →"}
          </a>
        )}
      </div>
    );
  }

  return (
    <form
      className={`launch-form ${variant === "bottom" ? "launch-form-bottom" : ""}`}
      onSubmit={handleSubmit}
    >
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
      {status === "error" && <p className="promo-error launch-form-error">{errMsg}</p>}
      <p className="launch-hint">No spam. Unsubscribe anytime.</p>
    </form>
  );
}

export function LaunchOffer({ offer }: { offer: Launch }) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(
    offer.expires_at ? calcTimeLeft(offer.expires_at) : null
  );
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<FormStatus>("idle");
  const [errMsg, setErrMsg] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!offer.expires_at) return;
    timerRef.current = setInterval(() => {
      const t = calcTimeLeft(offer.expires_at!);
      setTimeLeft(t);
      if (!t) clearInterval(timerRef.current!);
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [offer.expires_at]);

  const expired = offer.expires_at ? timeLeft === null && mounted : false;
  if (!offer.enabled || expired) {
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

  const showCountdown = Boolean(offer.expires_at && timeLeft);
  const hasBody = Boolean(offer.body_md.trim());
  const formProps = { offer, email, setEmail, status, setStatus, errMsg, setErrMsg };

  return (
    <div className="launch-offer">
      <section className="launch-hero">
        <div className="launch-hero-copy">
          <p className="promo-position-label launch-hero-label">{positionLabelText(offer.label_variant)}</p>
          <h1 className="launch-title">{offer.product_name || "Exclusive offer"}</h1>
          {offer.description && <p className="launch-desc">{offer.description}</p>}

          {showCountdown && timeLeft && (
            <div className="promo-countdown-row launch-countdown">
              <span className="promo-countdown-label">{countdownLabelText(offer.countdown_label)}</span>
              <div className="promo-countdown" aria-label={countdownLabelText(offer.countdown_label)}>
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

          <div className="launch-hero-form">
            <EmailGate {...formProps} variant="primary" />
          </div>

          {offer.review_url && (
            <a href={offer.review_url} className="launch-review-link">
              Prefer to read the full review first →
            </a>
          )}
        </div>

        {offer.image_url && (
          <div className="launch-hero-media" aria-hidden={!offer.product_name}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={offer.image_url}
              alt={offer.product_name}
              className="launch-img"
              loading="eager"
              decoding="async"
            />
          </div>
        )}
      </section>

      {hasBody && (
        <section className="launch-body" aria-label="About this launch">
          <MarkdownContent content={offer.body_md} />
        </section>
      )}

      {hasBody && status !== "ok" && (
        <section className="launch-bottom-cta">
          <h2 className="launch-bottom-title">
            {offer.discount_code ? "Ready for your exclusive code?" : "Ready for exclusive access?"}
          </h2>
          <p className="launch-bottom-sub">
            Enter your email below — we&rsquo;ll send it instantly. No spam.
          </p>
          <EmailGate {...formProps} variant="bottom" />
        </section>
      )}
    </div>
  );
}
