"use client";

import {
  BANNER_COUNTDOWN_LABELS,
  BANNER_LABEL_VARIANTS,
  type BannerCountdownLabel,
  type BannerLabelVariant,
  type Launch
} from "@/lib/launch";
import { useState } from "react";

type Props = { initial: Launch };

function isoToLocal(iso: string | null): { date: string; hour: string; minute: string } {
  const def = { date: "", hour: "23", minute: "59" };
  if (!iso) return def;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return def;
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    hour: pad(d.getHours()),
    minute: pad(d.getMinutes())
  };
}

function localToIso(date: string, hour: string, minute: string): string | null {
  if (!date) return null;
  const h = parseInt(hour, 10);
  const m = parseInt(minute, 10);
  if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) return null;
  const d = new Date(`${date}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

function displayIso(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()} — ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function LaunchEditor({ initial }: Props) {
  const [form, setForm] = useState<Launch>(initial);
  const [status, setStatus] = useState<"idle" | "saving" | "ok" | "error">("idle");
  const [msg, setMsg] = useState("");
  const [uploading, setUploading] = useState(false);

  const initParts = isoToLocal(initial.expires_at);
  const [dateVal, setDateVal] = useState(initParts.date);
  const [hourVal, setHourVal] = useState(initParts.hour);
  const [minuteVal, setMinuteVal] = useState(initParts.minute);

  function updateExpiry(d: string, h: string, mi: string) {
    update("expires_at", localToIso(d, h, mi));
  }

  function update<K extends keyof Launch>(key: K, value: Launch[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function uploadImage(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const r = await fetch("/api/upload", { method: "POST", body: fd });
    const j = await r.json();
    setUploading(false);
    if (!r.ok) return alert(j.error || "Upload failed");
    update("image_url", j.url);
  }

  async function save() {
    setStatus("saving");
    setMsg("");
    const r = await fetch("/api/launch", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form)
    });
    const j = await r.json();
    if (!r.ok) {
      setStatus("error");
      setMsg(j.error || "Save failed");
    } else {
      setForm({
        enabled: Boolean(j.enabled),
        product_name: String(j.product_name || ""),
        description: String(j.description || ""),
        body_md: String(j.body_md || ""),
        image_url: j.image_url || null,
        expires_at: j.expires_at || null,
        discount_code: j.discount_code || null,
        cta_url: j.cta_url || null,
        review_url: j.review_url || null,
        label_variant: j.label_variant || "exclusive_readers",
        countdown_label: j.countdown_label || "ends_in"
      });
      setStatus("ok");
      setMsg("Saved!");
      setTimeout(() => setStatus("idle"), 2000);
    }
  }

  return (
    <div className="editor">
      <label>
        <span className="banner-toggle-row">
          Enable launch page
          <input
            type="checkbox"
            checked={form.enabled}
            onChange={(e) => update("enabled", e.target.checked)}
          />
        </span>
        <small className="field-hint">
          Trang <code>/launch</code> hiện offer khi bật và chưa hết giờ. Dùng để ads / share thu email.
        </small>
      </label>

      <label>
        Offer label
        <select
          value={form.label_variant}
          onChange={(e) => update("label_variant", e.target.value as BannerLabelVariant)}
        >
          {BANNER_LABEL_VARIANTS.map((v) => (
            <option key={v} value={v}>
              {v === "featured_launch"
                ? "Featured Launch"
                : v === "partner_spotlight"
                  ? "Partner Spotlight"
                  : "Exclusive for PickBeforePay readers"}
            </option>
          ))}
        </select>
      </label>

      <label>
        Product name *
        <input
          type="text"
          value={form.product_name}
          onChange={(e) => update("product_name", e.target.value)}
          placeholder="e.g. Cold Case Cash"
          maxLength={120}
        />
      </label>

      <label>
        Short hook (hero)
        <textarea
          rows={2}
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          placeholder="1–2 sentences under the title — what they get if they join now"
          maxLength={220}
        />
        <small className="field-hint">Hiện ngay dưới tên sản phẩm, trên form email.</small>
      </label>

      <label>
        Long description (prelaunch body)
        <textarea
          rows={14}
          value={form.body_md}
          onChange={(e) => update("body_md", e.target.value)}
          placeholder={`## Why this matters\n\nPain point for cold visitors…\n\n## What's included\n\n- Benefit one\n- Benefit two\n- Benefit three\n\n## Who it's for\n\n…`}
          className="launch-body-editor"
        />
        <small className="field-hint">
          Markdown được hỗ trợ (## heading, list, bold). Dùng để thuyết phục người lạ — hiện dưới hero.
        </small>
      </label>

      <label>
        CTA URL after signup (affiliate)
        <input
          type="url"
          value={form.cta_url || ""}
          onChange={(e) => update("cta_url", e.target.value || null)}
          placeholder="https://warriorplus.com/..."
        />
        <small className="field-hint">Hiện sau khi nhập email (Grab the deal / Claim bonus).</small>
      </label>

      <label>
        Review article URL (optional)
        <input
          type="url"
          value={form.review_url || ""}
          onChange={(e) => update("review_url", e.target.value || null)}
          placeholder="https://pickbeforepay.com/posts/..."
        />
        <small className="field-hint">Link “Prefer to read the full review first” trên /launch.</small>
      </label>

      <label>
        Discount code (optional)
        <input
          type="text"
          value={form.discount_code || ""}
          onChange={(e) => update("discount_code", e.target.value || null)}
          placeholder="e.g. EARLY30"
          maxLength={60}
        />
        <small className="field-hint">Hiện sau khi submit email. Để trống nếu chỉ tặng bonus.</small>
      </label>

      <label>
        Countdown label
        <select
          value={form.countdown_label}
          onChange={(e) => update("countdown_label", e.target.value as BannerCountdownLabel)}
        >
          {BANNER_COUNTDOWN_LABELS.map((v) => (
            <option key={v} value={v}>
              {v === "launches_in" ? "Launches in" : v === "offer_ends" ? "Offer ends in" : "Ends in"}
            </option>
          ))}
        </select>
      </label>

      <div style={{ marginBottom: 16 }}>
        <span style={{ fontSize: 13, fontWeight: 550, color: "var(--muted)", display: "block", marginBottom: 8 }}>
          Countdown ends at
        </span>
        <div className="banner-dt-row">
          <input
            type="date"
            className="banner-dt-date"
            value={dateVal}
            onChange={(e) => {
              setDateVal(e.target.value);
              updateExpiry(e.target.value, hourVal, minuteVal);
            }}
          />
          <div className="banner-dt-time">
            <input
              type="text"
              inputMode="numeric"
              className="banner-dt-hour"
              value={hourVal}
              maxLength={2}
              placeholder="23"
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "").slice(0, 2);
                setHourVal(v);
                updateExpiry(dateVal, v, minuteVal);
              }}
            />
            <span className="banner-dt-sep">:</span>
            <input
              type="text"
              inputMode="numeric"
              className="banner-dt-min"
              value={minuteVal}
              maxLength={2}
              placeholder="59"
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "").slice(0, 2);
                setMinuteVal(v);
                updateExpiry(dateVal, hourVal, v);
              }}
            />
          </div>
        </div>
        {form.expires_at && (
          <small className="field-hint" style={{ marginTop: 6, display: "block" }}>
            ✓ <b>{displayIso(form.expires_at)}</b> (giờ máy bạn)
          </small>
        )}
        <small className="field-hint">Hết giờ thì /launch hiện “This offer has ended”.</small>
      </div>

      <label className="upload">
        Product image (optional)
        <input
          type="file"
          accept="image/*"
          disabled={uploading}
          onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])}
        />
        {uploading && <span>Uploading…</span>}
        {!uploading && form.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={form.image_url} alt="Launch product" />
        ) : (
          !uploading && <span>Square image recommended</span>
        )}
        {form.image_url && (
          <button
            type="button"
            className="btn-ghost"
            style={{ marginTop: 8, padding: "4px 10px", fontSize: 12 }}
            onClick={() => update("image_url", null)}
          >
            Remove image
          </button>
        )}
      </label>

      <div className="editor-actions">
        <button type="button" className="primary-btn" disabled={status === "saving"} onClick={save}>
          {status === "saving" ? "Saving…" : "Save launch page"}
        </button>
        {msg && <p className={`subscribe-msg ${status === "ok" ? "is-ok" : "is-error"}`}>{msg}</p>}
      </div>
    </div>
  );
}
