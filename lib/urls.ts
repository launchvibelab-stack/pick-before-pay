/**
 * Normalize optional URLs for outbound links / redirects.
 * Only https: allowed (blocks javascript:, data:, http: open-redirect tricks).
 * When allowRelative is true, same-site paths like /posts/slug are kept as-is.
 */
export function normalizeSafeHttpsUrl(
  raw: string | null | undefined,
  fieldLabel = "URL",
  opts?: { allowRelative?: boolean }
): { url: string | null; error?: string } {
  const s = String(raw || "").trim();
  if (!s) return { url: null };

  if (opts?.allowRelative && s.startsWith("/") && !s.startsWith("//")) {
    if (s.includes("\\") || /[\s<>"']/.test(s)) {
      return { url: null, error: `${fieldLabel} path is not valid.` };
    }
    return { url: s };
  }

  let candidate = s;
  if (!/^https?:\/\//i.test(candidate)) candidate = `https://${candidate}`;

  let u: URL;
  try {
    u = new URL(candidate);
  } catch {
    return { url: null, error: `${fieldLabel} is not a valid link.` };
  }

  if (u.protocol !== "https:") {
    return { url: null, error: `${fieldLabel} must use https://` };
  }

  if (u.username || u.password) {
    return { url: null, error: `${fieldLabel} must not include credentials.` };
  }
  const host = u.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "0.0.0.0" ||
    host === "::1" ||
    host.endsWith(".local") ||
    host === "metadata.google.internal"
  ) {
    return { url: null, error: `${fieldLabel} host is not allowed.` };
  }

  return { url: u.toString() };
}

/** True only for safe absolute https URLs (used before redirects). */
export function isSafeHttpsUrl(raw: string | null | undefined): boolean {
  return Boolean(normalizeSafeHttpsUrl(raw).url);
}
