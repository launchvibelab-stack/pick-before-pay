"use client";

import { useEffect, useState } from "react";

export function ProfileImageLightbox({ src, alt }: { src: string; alt: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="about-profile-img-btn"
        onClick={() => setOpen(true)}
        aria-label="View full size image"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="about-profile-img"
          loading="lazy"
          decoding="async"
        />
        <span className="about-profile-img-hint" aria-hidden>🔍 Click to enlarge</span>
      </button>

      {open && (
        <div
          className="lightbox-overlay"
          role="dialog"
          aria-modal
          aria-label="Full size image"
          onClick={() => setOpen(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className="lightbox-img"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            className="lightbox-close"
            onClick={() => setOpen(false)}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}
