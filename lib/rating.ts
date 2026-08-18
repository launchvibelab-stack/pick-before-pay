/** Editor review score 1.0–5.0 (one decimal). */
export function parseEditorScore(raw: unknown): number | null {
  if (raw == null || raw === "") return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  if (n < 1 || n > 5) return null;
  return Math.round(n * 10) / 10;
}

export function formatEditorScore(score: number): string {
  return Number.isInteger(score) ? String(score) : score.toFixed(1);
}

/** Visible star row + text for editor score (must match JSON-LD). */
export function scoreStars(score: number): string {
  const full = Math.floor(score);
  const half = score - full >= 0.5;
  return "★".repeat(full) + (half ? "½" : "") + "☆".repeat(Math.max(0, 5 - full - (half ? 1 : 0)));
}
