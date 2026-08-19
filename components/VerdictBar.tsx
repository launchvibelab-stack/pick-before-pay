"use client";

import { useEffect, useState } from "react";

type Props = {
  productName: string;
  score: number | null;
  stars: string;
  formattedScore: string;
  affiliateUrl: string | null;
  postId: string;
};

export function VerdictBar({ productName, score, stars, formattedScore, affiliateUrl, postId }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const passedIntro = window.scrollY > 320;
      const remaining = document.documentElement.scrollHeight - (window.scrollY + window.innerHeight);
      const nearFooter = remaining < 220;
      setVisible(passedIntro && !nearFooter);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <div className="verdict-bar" role="region" aria-label="Review verdict">
      <div className="verdict-bar-inner">
        <div className="verdict-bar-left">
          <span className="verdict-bar-name">{productName}</span>
          {score != null && (
            <span className="verdict-bar-rating" aria-label={`${formattedScore} out of 5`}>
              <span className="verdict-bar-stars" aria-hidden>{stars}</span>
              <span className="verdict-bar-score">{formattedScore}<span className="verdict-bar-max">/5</span></span>
            </span>
          )}
        </div>
        {affiliateUrl && (
          <a
            href={`/api/go/${postId}`}
            className="verdict-bar-cta"
            rel="nofollow sponsored noopener"
            target="_blank"
          >
            Get it now →
          </a>
        )}
      </div>
    </div>
  );
}
