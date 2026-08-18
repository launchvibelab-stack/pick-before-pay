import { randomBytes } from "crypto";
import {
  DRIP_OFFSETS_DAYS,
  DRIP_STEP_DONE,
  buildDripEmail,
  type DripStep
} from "@/lib/drip-emails";
import { sendResendEmail, resendConfigured } from "@/lib/resend";
import { getSupabaseAdmin } from "@/lib/supabase";

export type Subscriber = {
  id: string;
  email: string;
  name: string | null;
  unsubscribe_token: string;
  subscribed_at: string;
  unsubscribed_at: string | null;
  drip_step: number;
  last_drip_at: string | null;
};

function newToken() {
  return randomBytes(24).toString("hex");
}

function daysSince(iso: string) {
  const start = new Date(iso).getTime();
  if (Number.isNaN(start)) return 0;
  return Math.floor((Date.now() - start) / 86_400_000);
}

export async function upsertSubscriber(email: string, name?: string): Promise<Subscriber> {
  const db = getSupabaseAdmin();
  const normalized = email.trim().toLowerCase();

  const { data: existing } = await db
    .from("subscribers")
    .select("*")
    .eq("email", normalized)
    .maybeSingle();

  if (existing) {
    if (existing.unsubscribed_at) {
      const { data, error } = await db
        .from("subscribers")
        .update({
          name: name?.trim() || existing.name,
          unsubscribed_at: null,
          subscribed_at: new Date().toISOString(),
          drip_step: 0,
          last_drip_at: null,
          unsubscribe_token: existing.unsubscribe_token || newToken()
        })
        .eq("id", existing.id)
        .select("*")
        .single();
      if (error) throw error;
      return data as Subscriber;
    }
    if (name?.trim() && name.trim() !== existing.name) {
      await db.from("subscribers").update({ name: name.trim() }).eq("id", existing.id);
    }
    return existing as Subscriber;
  }

  const { data, error } = await db
    .from("subscribers")
    .insert({
      email: normalized,
      name: name?.trim() || null,
      unsubscribe_token: newToken(),
      drip_step: 0
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as Subscriber;
}

export async function unsubscribeByToken(token: string): Promise<boolean> {
  const t = token.trim();
  if (!t) return false;
  const { data, error } = await getSupabaseAdmin()
    .from("subscribers")
    .update({ unsubscribed_at: new Date().toISOString(), drip_step: DRIP_STEP_DONE })
    .eq("unsubscribe_token", t)
    .is("unsubscribed_at", null)
    .select("id")
    .maybeSingle();
  if (error) throw error;
  return Boolean(data?.id);
}

export async function sendDripStep(sub: Subscriber, step: DripStep): Promise<{ ok: boolean; error?: string }> {
  if (!resendConfigured()) return { ok: false, error: "Resend not configured" };
  if (sub.unsubscribed_at) return { ok: false, error: "Unsubscribed" };

  const mail = buildDripEmail(step, { name: sub.name, token: sub.unsubscribe_token });
  const sent = await sendResendEmail({
    to: sub.email,
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
    unsubscribeUrl: mail.unsubscribeUrl
  });
  if (!sent.ok) return { ok: false, error: sent.error };

  const nextStep = step + 1;
  const { error } = await getSupabaseAdmin()
    .from("subscribers")
    .update({
      drip_step: nextStep >= DRIP_STEP_DONE ? DRIP_STEP_DONE : nextStep,
      last_drip_at: new Date().toISOString()
    })
    .eq("id", sub.id)
    .is("unsubscribed_at", null);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** Immediate day-0 email for brand-new / re-subscribed contacts. */
export async function sendWelcomeIfNeeded(sub: Subscriber) {
  if (sub.drip_step !== 0 || sub.unsubscribed_at) return { sent: false as const };
  const result = await sendDripStep(sub, 0);
  return { sent: result.ok, error: result.error };
}

export async function processDueDripEmails(limit = 40) {
  if (!resendConfigured()) {
    return { scanned: 0, sent: 0, errors: ["Resend not configured"] as string[] };
  }

  const { data, error } = await getSupabaseAdmin()
    .from("subscribers")
    .select("*")
    .is("unsubscribed_at", null)
    .lt("drip_step", DRIP_STEP_DONE)
    .order("subscribed_at", { ascending: true })
    .limit(200);
  if (error) throw error;

  let sent = 0;
  const errors: string[] = [];
  const rows = (data || []) as Subscriber[];

  for (const sub of rows) {
    if (sent >= limit) break;
    const step = sub.drip_step as DripStep;
    if (step < 0 || step > 4) continue;
    const needDays = DRIP_OFFSETS_DAYS[step];
    if (daysSince(sub.subscribed_at) < needDays) continue;

    const result = await sendDripStep(sub, step);
    if (result.ok) sent += 1;
    else if (result.error) errors.push(`${sub.email}: ${result.error}`);
  }

  return { scanned: rows.length, sent, errors };
}
