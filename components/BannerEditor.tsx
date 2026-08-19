"use client";

import type { Banner } from "@/lib/banner";
import { useState } from "react";

type Props = { initial: Banner };

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  // "YYYY-MM-DDTHH:MM" format required by datetime-local
  return d.toISOString().slice(0, 16);
}

function fromDatetimeLocal(val: string): string | null {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

export function BannerEditor({ initial }: Props) {
  const [form, setForm] = useState<Banner>(initial);
  const [status, setStatus] = useState<"idle" | "saving" | "ok" | "error">("idle");
  const [msg, setMsg] = useState("");
  const [uploading, setUploading] = useState(false);

  function update<K extends keyof Banner>(key: K, value: Banner[K]) {
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
    const r = await fetch("/api/banner", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form)
    });
    const j = await r.json();
    if (!r.ok) {
      setStatus("error");
      setMsg(j.error || "Save failed");
    } else {
      setStatus("ok");
      setMsg("Saved!");
      setTimeout(() => setStatus("idle"), 2000);
    }
  }

  return (
    <div className="editor">
      <label>
        <span className="banner-toggle-row">
          Enable banner
          <input
            type="checkbox"
            checked={form.enabled}
            onChange={(e) => update("enabled", e.target.checked)}
          />
        </span>
        <small className="field-hint">
          Banner chỉ hiện khi bật và chưa hết giờ đếm ngược.
        </small>
      </label>

      <label>
        Product name *
        <input
          type="text"
          value={form.product_name}
          onChange={(e) => update("product_name", e.target.value)}
          placeholder="e.g. Shigai Royalty"
          maxLength={120}
        />
      </label>

      <label>
        Short description
        <textarea
          rows={2}
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          placeholder="One-line hook for the product"
          maxLength={200}
        />
      </label>

      <label>
        CTA URL (optional)
        <input
          type="url"
          value={form.cta_url || ""}
          onChange={(e) => update("cta_url", e.target.value || null)}
          placeholder="https://warriorplus.com/..."
        />
        <small className="field-hint">Link khi bấm nút CTA. Dùng affiliate link của bạn.</small>
      </label>

      <label>
        Countdown ends at *
        <input
          type="datetime-local"
          value={toDatetimeLocal(form.expires_at)}
          onChange={(e) => update("expires_at", fromDatetimeLocal(e.target.value))}
        />
        <small className="field-hint">
          Nhập giờ theo múi giờ máy tính của bạn. Banner tự ẩn khi hết giờ.
        </small>
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
        <small className="field-hint">
          Hiện sau khi người dùng nhập email. Để trống nếu không có mã.
        </small>
      </label>

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
          <img src={form.image_url} alt="Banner product" />
        ) : (
          !uploading && <span>Choose an image to upload</span>
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
        <button
          type="button"
          className="primary-btn"
          disabled={status === "saving"}
          onClick={save}
        >
          {status === "saving" ? "Saving…" : "Save banner"}
        </button>
        {msg && (
          <p className={`subscribe-msg ${status === "ok" ? "is-ok" : "is-error"}`}>{msg}</p>
        )}
      </div>
    </div>
  );
}
