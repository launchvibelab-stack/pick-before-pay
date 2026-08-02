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

    const send = () => {
      void fetch("/api/analytics/pageview", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ path, postId }),
        keepalive: true
      });
    };

    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    if (typeof w.requestIdleCallback === "function") {
      const id = w.requestIdleCallback(send, { timeout: 2500 });
      return () => w.cancelIdleCallback?.(id);
    }

    const t = setTimeout(send, 1200);
    return () => clearTimeout(t);
  }, [path, postId]);

  return null;
}
