function getResponseCredentials() {
  const apiKey = process.env.GETRESPONSE_API_KEY?.trim();
  const campaignId = process.env.GETRESPONSE_CAMPAIGN_ID?.trim();
  if (!apiKey || !campaignId) return null;
  return { apiKey, campaignId };
}

function authHeaders(apiKey: string) {
  return {
    "Content-Type": "application/json",
    "X-Auth-Token": `api-key ${apiKey}`
  };
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function parseError(res: Response, fallback: string) {
  const text = await res.text().catch(() => "");
  try {
    const j = JSON.parse(text) as { message?: string; code?: number };
    if (j.message) return j.message;
  } catch {
    /* ignore */
  }
  return text ? `${fallback}: ${text.slice(0, 180)}` : fallback;
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
    headers: authHeaders(creds.apiKey),
    body: JSON.stringify(payload)
  });

  // 202 = accepted; 409 often means already subscribed
  if (res.status === 202 || res.status === 200 || res.status === 409) {
    return { ok: true };
  }

  return { ok: false, error: await parseError(res, `GetResponse error (${res.status})`) };
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

async function resolveFromFieldId(apiKey: string): Promise<string | null> {
  const fromEnv = process.env.GETRESPONSE_FROM_FIELD_ID?.trim();
  if (fromEnv) return fromEnv;

  const res = await fetch("https://api.getresponse.com/v3/from-fields", {
    headers: { "X-Auth-Token": `api-key ${apiKey}` },
    next: { revalidate: 3600 }
  });
  if (!res.ok) return null;

  const fields = (await res.json()) as Array<{
    fromFieldId?: string;
    isDefault?: string | boolean;
  }>;
  if (!Array.isArray(fields) || fields.length === 0) return null;

  const preferred =
    fields.find((f) => f.isDefault === "true" || f.isDefault === true || f.isDefault === "yes") ||
    fields[0];
  return preferred.fromFieldId || null;
}

function buildReviewEmailHtml(opts: {
  title: string;
  excerpt: string;
  url: string;
}) {
  const title = escapeHtml(opts.title);
  const excerpt = escapeHtml(opts.excerpt || "A new PickBeforePay review is live.");
  const url = escapeHtml(opts.url);

  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f4f4f6;font-family:Arial,Helvetica,sans-serif;color:#1a1a1f;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f6;padding:28px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #e6e6ea;border-radius:14px;overflow:hidden;">
          <tr>
            <td style="padding:22px 28px 8px;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#6b6b76;">
              PickBeforePay
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 6px;font-size:24px;line-height:1.3;font-weight:700;">
              ${title}
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 22px;font-size:16px;line-height:1.6;color:#4a4a55;">
              ${excerpt}
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 28px;">
              <a href="${url}" style="display:inline-block;background:#111118;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:10px;font-size:15px;font-weight:700;">
                Read the review
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 24px;font-size:12px;line-height:1.5;color:#8a8a95;">
              You’re receiving this because you subscribed at pickbeforepay.com. Unsubscribe anytime from the link in this email.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export type NotifyResult = {
  sent: boolean;
  warning?: string;
};

/**
 * Send a broadcast to the campaign list for a newly published review.
 * Call only on first publish (draft → live / create as published).
 */
export async function sendNewReviewBroadcast(opts: {
  title: string;
  excerpt?: string | null;
  slug: string;
  postId: string;
}): Promise<NotifyResult> {
  const creds = getResponseCredentials();
  if (!creds) {
    return { sent: false, warning: "GetResponse is not configured; skipped subscriber email." };
  }

  const fromFieldId = await resolveFromFieldId(creds.apiKey);
  if (!fromFieldId) {
    return {
      sent: false,
      warning:
        "GetResponse from-field not found. Set GETRESPONSE_FROM_FIELD_ID or add a sender email in GetResponse."
    };
  }

  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://pickbeforepay.com").replace(/\/$/, "");
  const url = `${base}/posts/${opts.slug}`;
  const subject = `New review: ${opts.title}`.slice(0, 128);
  const name = `New review ${opts.postId}`.slice(0, 128);
  const excerpt = (opts.excerpt || "").trim();
  const plain = [
    opts.title,
    "",
    excerpt || "A new PickBeforePay review is live.",
    "",
    `Read the review: ${url}`,
    "",
    "You’re receiving this because you subscribed at pickbeforepay.com."
  ].join("\n");

  const payload = {
    name,
    subject,
    type: "broadcast",
    editor: "custom",
    flags: ["openrate", "clicktrack"],
    campaign: { campaignId: creds.campaignId },
    fromField: { fromFieldId },
    content: {
      html: buildReviewEmailHtml({ title: opts.title, excerpt, url }),
      plain
    },
    sendSettings: {
      selectedCampaigns: [creds.campaignId],
      selectedSegments: [],
      selectedSuppressions: [],
      excludedCampaigns: [],
      excludedSegments: [],
      selectedContacts: [],
      timeTravel: "false",
      perfectTiming: "false"
    }
  };

  const res = await fetch("https://api.getresponse.com/v3/newsletters", {
    method: "POST",
    headers: authHeaders(creds.apiKey),
    body: JSON.stringify(payload)
  });

  // 201 created / 202 queued
  if (res.status === 201 || res.status === 202 || res.status === 200) {
    return { sent: true };
  }

  return {
    sent: false,
    warning: await parseError(res, `Subscriber email failed (${res.status})`)
  };
}

/** First-publish only: skip edits and republish after newsletter already sent. */
export async function maybeNotifySubscribers(opts: {
  id: string;
  title: string;
  excerpt?: string | null;
  slug: string;
  published: boolean;
  wasPublished: boolean;
  newsletterSentAt?: string | null;
}): Promise<NotifyResult | null> {
  if (!opts.published) return null;
  if (opts.wasPublished) return null;
  if (opts.newsletterSentAt) return null;

  return sendNewReviewBroadcast({
    postId: opts.id,
    title: opts.title,
    excerpt: opts.excerpt,
    slug: opts.slug
  });
}
