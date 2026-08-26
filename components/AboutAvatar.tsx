"use client";

import { useState } from "react";

type Props = {
  src: string | null;
  name: string;
};

export function AboutAvatar({ src, name }: Props) {
  const [failed, setFailed] = useState(false);
  const letter = (name || "?").slice(0, 1).toUpperCase();

  if (!src || failed) {
    return (
      <div className="about-avatar about-avatar-fallback" aria-hidden>
        {letter}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name}
      width={112}
      height={112}
      className="about-avatar"
      loading="eager"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
