export type ResendSendResult = { ok: true; id?: string } | { ok: false; error: string };

export function resendConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim() && process.env.RESEND_FROM_EMAIL?.trim());
}

export async function sendResendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  unsubscribeUrl?: string;
}): Promise<ResendSendResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const fromEmail = process.env.RESEND_FROM_EMAIL?.trim();
  const fromName = (process.env.RESEND_FROM_NAME || "PickBeforePay").trim();
  const replyTo = process.env.RESEND_REPLY_TO?.trim();

  if (!apiKey || !fromEmail) {
    return { ok: false, error: "Resend is not configured (API key / from email)." };
  }

  const payload: Record<string, unknown> = {
    from: `${fromName} <${fromEmail}>`,
    to: [opts.to],
    subject: opts.subject,
    html: opts.html
  };
  if (opts.text) payload.text = opts.text;
  if (replyTo) payload.reply_to = replyTo;
  if (opts.unsubscribeUrl) {
    payload.headers = {
      "List-Unsubscribe": `<${opts.unsubscribeUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click"
    };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const text = await res.text().catch(() => "");
  if (!res.ok) {
    let message = `Resend error (${res.status})`;
    try {
      const j = JSON.parse(text) as { message?: string };
      if (j.message) message = j.message;
    } catch {
      if (text) message = text.slice(0, 200);
    }
    return { ok: false, error: message };
  }

  try {
    const j = JSON.parse(text) as { id?: string };
    return { ok: true, id: j.id };
  } catch {
    return { ok: true };
  }
}
