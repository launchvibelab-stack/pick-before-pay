/** Parse optional YouTube URLs without loading the player until click. */

export type YouTubeRef = {
  id: string;
  start?: number;
};

function validId(id: string | null | undefined): string | null {
  if (!id) return null;
  const clean = id.split("?")[0].split("&")[0];
  return /^[a-zA-Z0-9_-]{11}$/.test(clean) ? clean : null;
}

function parseStart(raw: string | null): number | undefined {
  if (!raw) return undefined;
  if (/^\d+$/.test(raw)) {
    const n = Number(raw);
    return n > 0 ? n : undefined;
  }
  const m = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/i.exec(raw);
  if (!m) return undefined;
  const seconds = Number(m[1] || 0) * 3600 + Number(m[2] || 0) * 60 + Number(m[3] || 0);
  return seconds > 0 ? seconds : undefined;
}

export function parseYouTubeRef(raw: string | null | undefined): YouTubeRef | null {
  let s = String(raw || "").trim();
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;

  try {
    const u = new URL(s);
    const host = u.hostname.replace(/^www\./, "").toLowerCase();
    const start = parseStart(u.searchParams.get("t") || u.searchParams.get("start"));

    if (host === "youtu.be") {
      const id = validId(u.pathname.split("/").filter(Boolean)[0]);
      return id ? { id, start } : null;
    }

    if (
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "music.youtube.com" ||
      host === "youtube-nocookie.com"
    ) {
      const fromQuery = validId(u.searchParams.get("v"));
      if (fromQuery) return { id: fromQuery, start };

      const parts = u.pathname.split("/").filter(Boolean);
      if (parts[0] && ["embed", "shorts", "live", "v"].includes(parts[0])) {
        const id = validId(parts[1]);
        return id ? { id, start } : null;
      }
    }
  } catch {
    const id = validId(s);
    return id ? { id } : null;
  }

  return null;
}

/** Empty is fine. Invalid non-empty URLs return an error message. */
export function normalizeYoutubeUrl(raw: unknown): { url: string | null; error?: string } {
  const s = String(raw ?? "").trim();
  if (!s) return { url: null };
  if (!parseYouTubeRef(s)) {
    return {
      url: null,
      error: "YouTube URL is not valid. Paste a watch, youtu.be, Shorts, or embed link."
    };
  }
  return { url: s };
}

export function youtubeThumbUrl(id: string) {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

export function youtubeEmbedUrl(ref: YouTubeRef, autoplay = false) {
  const params = new URLSearchParams({ rel: "0" });
  if (autoplay) params.set("autoplay", "1");
  if (ref.start) params.set("start", String(ref.start));
  return `https://www.youtube-nocookie.com/embed/${ref.id}?${params.toString()}`;
}

export function youtubeWatchUrl(ref: YouTubeRef) {
  const params = new URLSearchParams({ v: ref.id });
  if (ref.start) params.set("t", `${ref.start}s`);
  return `https://www.youtube.com/watch?${params.toString()}`;
}
