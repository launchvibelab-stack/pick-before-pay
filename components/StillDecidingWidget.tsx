"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  productName: string;
  affiliateUrl: string | null;
  postId: string;
  /** 3 short reasons pulled from post — fallback to generics if empty */
  reasons?: string[];
};

const SCROLL_THRESHOLD = 0.6; // show after 60% scroll depth

const GENERIC_REASONS = [
  "Saves you hours of research",
  "Honest pros & cons — no hype",
  "Exclusive bonus via our link",
];

export function StillDecidingWidget({ productName, affiliateUrl, postId, reasons }: Props) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const shownRef = useRef(false);

  useEffect(() => {
    const onScroll = () => {
      if (dismissed) return;
      const scrolled = window.scrollY + window.innerHeight;
      const total = document.documentElement.scrollHeight;
      if (!shownRef.current && scrolled / total >= SCROLL_THRESHOLD) {
        shownRef.current = true;
        setVisible(true);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [dismissed]);

  if (!visible || dismissed || !affiliateUrl) return null;

  const bullets = reasons && reasons.length >= 1 ? reasons.slice(0, 3) : GENERIC_REASONS;

  return (
    <div className={`sd-widget ${expanded ? "sd-widget--open" : "sd-widget--collapsed"}`} role="complementary" aria-label="Still deciding?">
      {/* Header — always visible */}
      <div className="sd-widget-head" onClick={() => setExpanded((v) => !v)}>
        <span className="sd-widget-title">
          <span className="sd-widget-emoji" aria-hidden>🤔</span>
          Still deciding?
        </span>
        <span className="sd-widget-toggle" aria-hidden>{expanded ? "▾" : "▸"}</span>
      </div>

      {/* Body — only when expanded */}
      {expanded && (
        <div className="sd-widget-body">
          <p className="sd-widget-subtitle">Top 3 reasons to try <strong>{productName}</strong>:</p>
          <ul className="sd-widget-list">
            {bullets.map((r, i) => (
              <li key={i}>
                <span className="sd-widget-check" aria-hidden>✓</span>
                {r}
              </li>
            ))}
          </ul>
          <a
            href={`/api/go/${postId}`}
            className="sd-widget-cta"
            rel="nofollow sponsored noopener"
            target="_blank"
          >
            Yes, I&rsquo;m in →
          </a>
          <button
            type="button"
            className="sd-widget-skip"
            onClick={() => setDismissed(true)}
          >
            Maybe later
          </button>
        </div>
      )}

      {/* Dismiss when collapsed */}
      {!expanded && (
        <button
          type="button"
          className="sd-widget-dismiss"
          onClick={() => setDismissed(true)}
          aria-label="Close widget"
        >✕</button>
      )}
    </div>
  );
}
