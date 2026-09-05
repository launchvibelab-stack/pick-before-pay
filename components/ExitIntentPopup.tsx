"use client";

import type { Launch } from "@/lib/launch";
import { englishRequiredEmailProps } from "@/lib/formValidation";
import { useEffect, useRef, useState } from "react";

const SESSION_KEY = "exit_popup_seen";

export function ExitIntentPopup({ offer }: { offer: Launch }) {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [errMsg, setErrMsg] = useState("");
  const firedRef = useRef(false);

  const isActive =
    offer.enabled &&
    offer.product_name &&
    (!offer.expires_at || new Date(offer.expires_at).getTime() > Date.now());

  useEffect(() => {
    if (!isActive) return;
    if (sessionStorage.getItem(SESSION_KEY)) return;

    const onMouseLeave = (e: MouseEvent) => {
      if (firedRef.current) return;
      if (e.clientY <= 20) {
        firedRef.current = true;
        sessionStorage.setItem(SESSION_KEY, "1");
        // Small delay so it feels natural
        setTimeout(() => setVisible(true), 120);
      }
    };

    // Mobile fallback: show after 45s on page with no interaction
    const mobileTimer = setTimeout(() => {
      if (firedRef.current) return;
      firedRef.current = true;
      sessionStorage.setItem(SESSION_KEY, "1");
      setVisible(true);
    }, 45_000);

    document.addEventListener("mouseleave", onMouseLeave);
    return () => {
      document.removeEventListener("mouseleave", onMouseLeave);
      clearTimeout(mobileTimer);
    };
  }, [isActive]);

  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setVisible(false); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [visible]);

  if (!visible) return null;

  const hasDiscount = Boolean(offer.discount_code);
  const ctaLabel = hasDiscount ? "Get my discount" : "Get exclusive bonus";

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
      if (!r.ok) { setStatus("error"); setErrMsg(j.error || "Please try again."); return; }
      setStatus("ok");
    } catch {
      setStatus("error");
      setErrMsg("Network error. Please try again.");
    }
  }

  return (
    <div
      className="exit-overlay"
      role="dialog"
      aria-modal
      aria-label="Special offer"
      onClick={(e) => { if (e.target === e.currentTarget) setVisible(false); }}
    >
      <div className="exit-popup">
        {/* Close */}
        <button
          type="button"
          className="exit-close"
          onClick={() => setVisible(false)}
          aria-label="Close"
        >✕</button>

        {/* Top badge */}
        <p className="exit-eyebrow">Wait! Before you go…</p>

        {/* Product image */}
        {offer.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={offer.image_url}
            alt={offer.product_name}
            className="exit-product-img"
            loading="eager"
            decoding="async"
          />
        )}

        <h2 className="exit-title">
          {hasDiscount
            ? `Get an exclusive discount on ${offer.product_name}`
            : `Get your exclusive bonus for ${offer.product_name}`}
        </h2>

        {(offer.cta_note || offer.description) && (
          <p className="exit-desc">{offer.cta_note || offer.description}</p>
        )}

        {status === "ok" ? (
          <div className="exit-success">
            <span className="exit-success-check">✓</span>
            <p>You&rsquo;re in! Check your inbox.</p>
            {offer.discount_code && (
              <div className="exit-code">
                Your code: <strong>{offer.discount_code}</strong>
              </div>
            )}
            {offer.cta_url && (
              <a
                href={offer.cta_url}
                className="exit-cta-btn"
                rel="nofollow noopener"
                target="_blank"
                onClick={() => setVisible(false)}
              >
                {hasDiscount ? "Grab the deal →" : "Claim your bonus →"}
              </a>
            )}
          </div>
        ) : (
          <form className="exit-form" onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status === "loading"}
              autoComplete="email"
              {...englishRequiredEmailProps()}
            />
            <button type="submit" className="exit-cta-btn" disabled={status === "loading"}>
              {status === "loading" ? "…" : ctaLabel}
            </button>
            {status === "error" && <p className="exit-error">{errMsg}</p>}
            <button type="button" className="exit-skip" onClick={() => setVisible(false)}>
              No thanks, I&rsquo;ll pass
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
