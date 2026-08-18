"use client";

import { useState } from "react";
import { parseYouTubeRef, youtubeEmbedUrl, youtubeThumbUrl } from "@/lib/youtube";

export function YouTubeLite({ url, title }: { url: string; title: string }) {
  const ref = parseYouTubeRef(url);
  const [playing, setPlaying] = useState(false);
  const [thumb, setThumb] = useState(ref ? youtubeThumbUrl(ref.id) : "");

  if (!ref) return null;

  function preconnect() {
    for (const href of ["https://www.youtube-nocookie.com", "https://i.ytimg.com"]) {
      if (document.querySelector(`link[rel="preconnect"][href="${href}"]`)) continue;
      const link = document.createElement("link");
      link.rel = "preconnect";
      link.href = href;
      document.head.appendChild(link);
    }
  }

  return (
    <figure className="yt-embed">
      <figcaption>Video Review</figcaption>
      <div className="yt-lite">
        {playing ? (
          <iframe
            src={youtubeEmbedUrl(ref, true)}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            className="yt-lite-play"
            onPointerEnter={preconnect}
            onFocus={preconnect}
            onClick={() => setPlaying(true)}
            aria-label={`Play video: ${title}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumb}
              alt=""
              width={480}
              height={360}
              loading="lazy"
              decoding="async"
              onError={() => setThumb(`https://i.ytimg.com/vi/${ref.id}/mqdefault.jpg`)}
            />
            <span className="yt-lite-btn" aria-hidden>
              <svg viewBox="0 0 68 48" width="68" height="48">
                <path
                  d="M66.52 7.74a8.5 8.5 0 0 0-6-6C55.4.64 34 .64 34 .64s-21.4 0-26.52 1.1a8.5 8.5 0 0 0-6 6C.64 12.86.64 24 .64 24s0 11.14 1.1 16.26a8.5 8.5 0 0 0 6 6C12.6 47.36 34 47.36 34 47.36s21.4 0 26.52-1.1a8.5 8.5 0 0 0 6-6C67.36 35.14 67.36 24 67.36 24s0-11.14-1.1-16.26z"
                  fill="#f00"
                />
                <path d="M45 24 27 14v20" fill="#fff" />
              </svg>
            </span>
          </button>
        )}
      </div>
    </figure>
  );
}
