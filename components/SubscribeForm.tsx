"use client";

import { useState } from "react";

export function SubscribeForm({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");
    try {
      const r = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, name: name || undefined })
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setStatus("error");
        setMessage(j.error || "Subscribe failed. Try again.");
        return;
      }
      setStatus("ok");
      setMessage("Thanks — check your inbox to confirm.");
      setEmail("");
      setName("");
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }

  return (
    <form className={`subscribe-form ${compact ? "subscribe-compact" : ""}`} onSubmit={onSubmit}>
      {!compact && (
        <input
          type="text"
          name="name"
          placeholder="Your name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
        />
      )}
      <div className="subscribe-row">
        <input
          type="email"
          name="email"
          required
          placeholder="you@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        <button className="primary-btn" type="submit" disabled={status === "loading"}>
          {status === "loading" ? "..." : "Subscribe"}
        </button>
      </div>
      {message && (
        <p className={`subscribe-msg ${status === "error" ? "is-error" : "is-ok"}`} role="status">
          {message}
        </p>
      )}
    </form>
  );
}
