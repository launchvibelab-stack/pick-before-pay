export const MARKETPLACE_PRESETS = ["Warrior+Plus", "JVZoo", "Launchpad", "ClickBank"] as const;

export function isPresetMarketplace(marketplace?: string | null) {
  return (MARKETPLACE_PRESETS as readonly string[]).includes(String(marketplace || "").trim());
}

/** Trim + length-cap optional marketplace label for posts / products. */
export function normalizeMarketplace(raw: unknown): string {
  return String(raw || "").trim().slice(0, 80);
}
