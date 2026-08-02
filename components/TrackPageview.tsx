"use client";

import { useEffect } from "react";

type Props = {
  path: string;
  postId?: string;
};

export function TrackPageview({ path, postId }: Props) {
  useEffect(() => {
    const key = `pv:${path}:${new Date().toISOString().slice(0, 10)}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      /* private mode */
    }
    void fetch("/api/analytics/pageview", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ path, postId }),
      keepalive: true
    });
  }, [path, postId]);

  return null;
}
