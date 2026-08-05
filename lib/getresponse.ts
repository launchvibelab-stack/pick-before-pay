function getResponseCredentials() {
  const apiKey = process.env.GETRESPONSE_API_KEY?.trim();
  const campaignId = process.env.GETRESPONSE_CAMPAIGN_ID?.trim();
  if (!apiKey || !campaignId) return null;
  return { apiKey, campaignId };
}

export async function addGetResponseContact(
  email: string,
  name?: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const creds = getResponseCredentials();
  if (!creds) {
    return { ok: false, error: "GetResponse is not configured (API key / campaign id)." };
  }

  const payload: Record<string, unknown> = {
    email,
    campaign: { campaignId: creds.campaignId },
    dayOfCycle: 0
  };
  if (name?.trim()) payload.name = name.trim();

  const res = await fetch("https://api.getresponse.com/v3/contacts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Auth-Token": `api-key ${creds.apiKey}`
    },
    body: JSON.stringify(payload)
  });

  // 202 = accepted; 409 often means already subscribed
  if (res.status === 202 || res.status === 200 || res.status === 409) {
    return { ok: true };
  }

  const text = await res.text().catch(() => "");
  let message = `GetResponse error (${res.status})`;
  try {
    const j = JSON.parse(text) as { message?: string };
    if (j.message) message = j.message;
  } catch {
    if (text) message = text.slice(0, 180);
  }
  return { ok: false, error: message };
}

/** Contact count for the configured campaign (cached ~5 min). */
export async function getGetResponseSubscriberCount(): Promise<number | null> {
  const creds = getResponseCredentials();
  if (!creds) return null;

  try {
    const url = new URL("https://api.getresponse.com/v3/contacts");
    url.searchParams.set("query[campaignId]", creds.campaignId);
    url.searchParams.set("perPage", "1");

    const res = await fetch(url.toString(), {
      headers: { "X-Auth-Token": `api-key ${creds.apiKey}` },
      next: { revalidate: 300 }
    });

    if (!res.ok) return null;

    const raw =
      res.headers.get("TotalCount") ||
      res.headers.get("totalCount") ||
      res.headers.get("totalcount");
    const n = Number(raw);
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : null;
  } catch {
    return null;
  }
}
