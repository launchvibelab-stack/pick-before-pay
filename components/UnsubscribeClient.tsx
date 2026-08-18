"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function UnsubscribeClient({ token }: { token: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onConfirm() {
    setStatus("loading");
    setMessage("");
    try {
      const r = await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token })
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setStatus("error");
        setMessage(j.error || "Could not unsubscribe. Try again.");
        return;
      }
      setStatus("ok");
      setMessage("You’re unsubscribed. You won’t get further emails from this sequence.");
      router.refresh();
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }

  if (!token) {
    return <p className="muted-line">Missing unsubscribe link. Open the link from your email.</p>;
  }

  return (
    <div className="unsub-box">
      <h1>Unsubscribe</h1>
      <p>Stop the PickBeforePay email sequence? You can resubscribe anytime from the site footer.</p>
      {status !== "ok" && (
        <button className="primary-btn" type="button" disabled={status === "loading"} onClick={onConfirm}>
          {status === "loading" ? "Working…" : "Confirm unsubscribe"}
        </button>
      )}
      {message && (
        <p className={`subscribe-msg ${status === "error" ? "is-error" : "is-ok"}`} role="status">
          {message}
        </p>
      )}
    </div>
  );
}
