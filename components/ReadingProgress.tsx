"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  score: number | null;
  formattedScore: string;
  stars: string;
  productName: string;
};

const REVEAL_AT = 0.8; // reveal score badge at 80% scroll depth

export function ReadingProgress({ score, formattedScore, stars, productName }: Props) {
  const [progress, setProgress] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [badgeSeen, setBadgeSeen] = useState(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const onScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const scrolled = window.scrollY;
        const total = document.documentElement.scrollHeight - window.innerHeight;
        const pct = total > 0 ? Math.min(scrolled / total, 1) : 0;
        setProgress(pct);
        if (!revealed && pct >= REVEAL_AT) setRevealed(true);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [revealed]);

  // Mark badge as "seen" after it animates in (to stop pulsing)
  useEffect(() => {
    if (revealed && !badgeSeen) {
      const t = setTimeout(() => setBadgeSeen(true), 2800);
      return () => clearTimeout(t);
    }
  }, [revealed, badgeSeen]);

  const pct = Math.round(progress * 100);

  return (
    <>
      {/* ── Reading progress bar (fixed top) ── */}
      <div className="rp-bar-track" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Reading progress">
        <div className="rp-bar-fill" style={{ width: `${pct}%` }} />
      </div>

      {/* ── Score reveal badge (top-right, appears at 80%) ── */}
      {score != null && revealed && (
        <div className={`rp-badge ${badgeSeen ? "rp-badge--seen" : "rp-badge--pop"}`} aria-label={`Editor verdict: ${formattedScore} out of 5`}>
          <span className="rp-badge-label">Verdict</span>
          <span className="rp-badge-stars" aria-hidden>{stars}</span>
          <span className="rp-badge-score">
            {formattedScore}
            <span className="rp-badge-max">/5</span>
          </span>
          <span className="rp-badge-name">{productName}</span>
        </div>
      )}
    </>
  );
}
