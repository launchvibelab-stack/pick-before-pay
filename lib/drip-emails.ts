import { siteUrl } from "@/lib/seo";

export const DRIP_STEP_DONE = 5;

/** Days after signup when each step should send (one-time sequence). */
export const DRIP_OFFSETS_DAYS = [0, 2, 4, 6, 8] as const;

/**
 * 5-email arc (stranger → acquaintance):
 * 0 — Deliver Scorecard + set expectations
 * 1 — Teach: read a sales page with the Scorecard (no new bonus)
 * 2 — Deliver Red-Flag Detector
 * 3 — Trust: who we are + how we review (relationship)
 * 4 — Close: 3-step workflow recap (no re-sending PDFs)
 */
export type DripStep = 0 | 1 | 2 | 3 | 4;

export type DripEmail = {
  subject: string;
  html: string;
  text: string;
  unsubscribeUrl: string;
};

export function bonus1Url() {
  return process.env.BONUS_1_URL?.trim() || `${siteUrl()}/bonuses/buyers-scorecard.pdf`;
}

export function bonus3Url() {
  return process.env.BONUS_3_URL?.trim() || `${siteUrl()}/bonuses/red-flag-detector.pdf`;
}

export function unsubscribeUrl(token: string) {
  return `${siteUrl()}/unsubscribe?token=${encodeURIComponent(token)}`;
}

function founderSignOffHtml() {
  const about = `${siteUrl()}/about`;
  return `<p style="margin:24px 0 0;font-size:15px;line-height:1.6;color:#4a4540;">
    Warmly,<br/>
    <strong>Nhan Scope</strong><br/>
    <span style="color:#6b6560;">Founder, PickBeforePay</span><br/>
    <a href="${about}" style="color:#1c1b19;">About me</a>
  </p>`;
}

function founderSignOffText() {
  return `Warmly,\nNhan Scope\nFounder, PickBeforePay\nAbout: ${siteUrl()}/about`;
}

function layout(opts: { title: string; bodyHtml: string; unsub: string }) {
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f4f2ec;font-family:Georgia,'Times New Roman',serif;color:#1c1b19;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f2ec;padding:28px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:560px;background:#fffdf8;border:1px solid #e4dfd4;border-radius:12px;padding:28px 24px;">
        <tr><td>
          <p style="margin:0 0 6px;font-size:13px;letter-spacing:0.04em;text-transform:uppercase;color:#6b6560;">PickBeforePay</p>
          <p style="margin:0 0 16px;padding:10px 12px;background:#f7f3ea;border-radius:8px;font-family:Arial,sans-serif;font-size:13px;line-height:1.5;color:#5c564e;">
            If this is in Promotions or Updates, drag it to <strong>Primary</strong> so our notes stay easy to find.
          </p>
          <h1 style="margin:0 0 18px;font-size:24px;line-height:1.25;font-weight:700;">${opts.title}</h1>
          ${opts.bodyHtml}
          ${founderSignOffHtml()}
          <p style="margin:28px 0 0;font-size:12px;line-height:1.5;color:#8a847c;">
            You’re receiving this because you subscribed at pickbeforepay.com.
            <a href="${opts.unsub}" style="color:#8a847c;">Unsubscribe</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function cta(href: string, label: string) {
  return `<p style="margin:22px 0;"><a href="${href}" style="display:inline-block;background:#1c1b19;color:#fffdf8;text-decoration:none;padding:12px 18px;border-radius:8px;font-family:Arial,sans-serif;font-size:14px;font-weight:700;">${label}</a></p>`;
}

function plain(lines: string[]) {
  return lines.filter(Boolean).join("\n\n");
}

export function buildDripEmail(
  step: DripStep,
  opts: { name?: string | null; token: string }
): DripEmail {
  const unsub = unsubscribeUrl(opts.token);
  const hello = opts.name?.trim() ? `Hi ${opts.name.trim().split(/\s+/)[0]},` : "Hi,";
  const home = siteUrl();
  const footerText = `${founderSignOffText()}\n\nYou're receiving this because you subscribed at pickbeforepay.com.\nUnsubscribe: ${unsub}`;

  if (step === 0) {
    const subject = "Your Buyer’s Scorecard from PickBeforePay";
    const html = layout({
      title: "Decide before you buy",
      unsub,
      bodyHtml: `
        <p style="margin:0 0 14px;font-size:16px;line-height:1.6;">${hello}</p>
        <p style="margin:0 0 14px;font-size:16px;line-height:1.6;">
          Thanks for joining PickBeforePay. Here’s your <strong>Ultimate Digital Product Buyer’s Scorecard</strong> -
          a simple framework to score any tool, course, or PLR offer before you pay.
        </p>
        ${cta(bonus1Url(), "Download the Scorecard (PDF)")}
        <p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#4a4540;">
          Tip: open a sales page side-by-side and score usefulness, ease, hidden costs, support, and commercial potential.
        </p>
        <p style="margin:0;font-size:15px;line-height:1.6;color:#4a4540;">
          Over the next week I’ll send a few short notes - how to use this, one more checklist, and how we write honest reviews.
          No daily spam.
        </p>`
    });
    const text = plain([
      hello,
      "Thanks for joining PickBeforePay. Here’s your Ultimate Digital Product Buyer’s Scorecard - a simple framework to score any tool, course, or PLR offer before you pay.",
      `Download the Scorecard (PDF): ${bonus1Url()}`,
      "Tip: open a sales page side-by-side and score usefulness, ease, hidden costs, support, and commercial potential.",
      "Over the next week I’ll send a few short notes - how to use this, one more checklist, and how we write honest reviews. No daily spam.",
      footerText
    ]);
    return { subject, html, text, unsubscribeUrl: unsub };
  }

  if (step === 1) {
    const subject = "A simple way to read a sales page";
    const html = layout({
      title: "Cut through the hype",
      unsub,
      bodyHtml: `
        <p style="margin:0 0 14px;font-size:16px;line-height:1.6;">${hello}</p>
        <p style="margin:0 0 14px;font-size:16px;line-height:1.6;">
          Pull up the Scorecard you downloaded. Before you buy anything, scan the sales page for four things:
          unclear recurring fees, stacked OTOs, vague refunds, and income claims with no method.
        </p>
        <p style="margin:0 0 14px;font-size:16px;line-height:1.6;">
          Score each section honestly. If the total feels soft, walk away - even when the headline sounds perfect.
        </p>
        ${cta(`${home}/`, "Browse honest reviews")}
        <p style="margin:0;font-size:15px;line-height:1.6;color:#4a4540;">
          Next email: your Red-Flag Detector checklist - the deal-breakers the Scorecard might miss.
        </p>`
    });
    const text = plain([
      hello,
      "Pull up the Scorecard you downloaded. Before you buy anything, scan the sales page for four things: unclear recurring fees, stacked OTOs, vague refunds, and income claims with no method.",
      "Score each section honestly. If the total feels soft, walk away - even when the headline sounds perfect.",
      `Browse honest reviews: ${home}/`,
      "Next email: your Red-Flag Detector checklist - the deal-breakers the Scorecard might miss.",
      footerText
    ]);
    return { subject, html, text, unsubscribeUrl: unsub };
  }

  if (step === 2) {
    const subject = "Your Red-Flag Detector checklist";
    const html = layout({
      title: "Spot bad offers faster",
      unsub,
      bodyHtml: `
        <p style="margin:0 0 14px;font-size:16px;line-height:1.6;">${hello}</p>
        <p style="margin:0 0 14px;font-size:16px;line-height:1.6;">
          Here’s the <strong>Digital Product Red-Flag Detector</strong> - a due-diligence checklist for fake scarcity,
          weak licensing, abandoned tools, and misleading testimonials.
        </p>
        ${cta(bonus3Url(), "Download the Red-Flag Detector (PDF)")}
        <p style="margin:0;font-size:15px;line-height:1.6;color:#4a4540;">
          How the two tools work together: Scorecard for the overall fit; Red-Flag list for instant deal-breakers.
          Run both on any offer that passes the hype test. Takes minutes, saves real money.
        </p>`
    });
    const text = plain([
      hello,
      "Here’s the Digital Product Red-Flag Detector - a due-diligence checklist for fake scarcity, weak licensing, abandoned tools, and misleading testimonials.",
      `Download the Red-Flag Detector (PDF): ${bonus3Url()}`,
      "How the two tools work together: Scorecard for the overall fit; Red-Flag list for instant deal-breakers. Run both on any offer that passes the hype test.",
      footerText
    ]);
    return { subject, html, text, unsubscribeUrl: unsub };
  }

  if (step === 3) {
    const about = `${home}/about`;
    const subject = "Why I built PickBeforePay";
    const html = layout({
      title: "Honest reviews, no hype",
      unsub,
      bodyHtml: `
        <p style="margin:0 0 14px;font-size:16px;line-height:1.6;">${hello}</p>
        <p style="margin:0 0 14px;font-size:16px;line-height:1.6;">
          I’m Nhan - I built PickBeforePay because I was tired of launch-page hype with no real evaluation.
          Every review covers what the product does, who it’s for, pros and cons, pricing, and an editor score you can see on the page.
        </p>
        <p style="margin:0 0 14px;font-size:16px;line-height:1.6;">
          Affiliate links help keep the site running, but they never change the verdict. If something isn’t worth it, we say so.
        </p>
        ${cta(about, "Read my story")}
        <p style="margin:0;font-size:15px;line-height:1.6;color:#4a4540;">
          Or jump straight to the latest reviews on the homepage whenever you’re researching a product.
        </p>`
    });
    const text = plain([
      hello,
      "I’m Nhan - I built PickBeforePay because I was tired of launch-page hype with no real evaluation. Every review covers what the product does, who it’s for, pros and cons, pricing, and an editor score you can see on the page.",
      "Affiliate links help keep the site running, but they never change the verdict. If something isn’t worth it, we say so.",
      `Read my story: ${about}`,
      `Latest reviews: ${home}/`,
      footerText
    ]);
    return { subject, html, text, unsubscribeUrl: unsub };
  }

  const subject = "Your 3-step check before any purchase";
  const html = layout({
    title: "You’re set",
    unsub,
    bodyHtml: `
      <p style="margin:0 0 14px;font-size:16px;line-height:1.6;">${hello}</p>
      <p style="margin:0 0 14px;font-size:16px;line-height:1.6;">
        Last note in this short series. Here’s the workflow I use before buying any digital product:
      </p>
      <ol style="margin:0 0 18px;padding-left:20px;font-size:16px;line-height:1.7;">
        <li><strong>Read a PickBeforePay review</strong> - features, price, who it’s for.</li>
        <li><strong>Run the Scorecard</strong> - score the offer on usefulness and value.</li>
        <li><strong>Run the Red-Flag list</strong> - catch deal-breakers the sales page hides.</li>
      </ol>
      <p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#4a4540;">
        Your PDFs are in the first emails from this week - save them somewhere easy to find.
        Lost a download? Reply to any PickBeforePay email and I’ll resend it.
      </p>
      ${cta(`${home}/`, "Back to PickBeforePay")}
      <p style="margin:0;font-size:15px;line-height:1.6;color:#4a4540;">
        After this, I’ll only email when we publish something worth your time. Unsubscribe anytime below.
      </p>`
  });
  const text = plain([
    hello,
    "Last note in this short series. Here’s the workflow I use before buying any digital product:",
    "1. Read a PickBeforePay review - features, price, who it’s for.",
    "2. Run the Scorecard - score the offer on usefulness and value.",
    "3. Run the Red-Flag list - catch deal-breakers the sales page hides.",
    "Your PDFs are in the first emails from this week. Lost a download? Reply to any PickBeforePay email and I’ll resend it.",
    `Back to PickBeforePay: ${home}/`,
    "After this, I’ll only email when we publish something worth your time.",
    footerText
  ]);
  return { subject, html, text, unsubscribeUrl: unsub };
}
