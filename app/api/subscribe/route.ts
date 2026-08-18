import { addGetResponseContact } from "@/lib/getresponse";
import { resendConfigured } from "@/lib/resend";
import { sendWelcomeIfNeeded, upsertSubscriber } from "@/lib/subscribers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email || "")
    .trim()
    .toLowerCase();
  const name = body.name ? String(body.name).trim() : undefined;

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  if (!resendConfigured() && !process.env.GETRESPONSE_API_KEY?.trim()) {
    return NextResponse.json({ error: "Email signup is temporarily unavailable." }, { status: 503 });
  }

  try {
    let welcomeSent = false;
    if (resendConfigured()) {
      const sub = await upsertSubscriber(email, name);
      const welcome = await sendWelcomeIfNeeded(sub);
      welcomeSent = welcome.sent;
      if (welcome.error && !welcome.sent) {
        // Still keep the subscriber; cron can retry day-0 if step stays 0
        console.error("welcome email:", welcome.error);
      }
    }

    // Best-effort CRM sync — do not block signup if GetResponse fails
    const gr = await addGetResponseContact(email, name).catch(() => ({
      ok: false as const,
      error: "GetResponse unavailable"
    }));

    if (!resendConfigured() && !gr.ok) {
      return NextResponse.json({ error: gr.error }, { status: 502 });
    }

    return NextResponse.json({ ok: true, welcomeSent });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Subscribe failed";
    // Common when migration not applied yet
    if (/subscribers/i.test(message) && /does not exist|schema cache/i.test(message)) {
      return NextResponse.json(
        { error: "Signup storage is not ready yet. Please try again shortly." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
