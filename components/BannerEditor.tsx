"use client";

import type { Banner } from "@/lib/banner";
import { useState } from "react";

type Props = { initial: Banner };

// ── datetime helpers ──────────────────────────────────────────

/** ISO UTC → local parts for the custom picker */
function isoToLocal(iso: string | null): {
  date: string;   // "YYYY-MM-DD"
  hour: string;   // "1"–"12"
  minute: string; // "00"–"59"
  ampm: "AM" | "PM";
} {
  const def = { date: "", hour: "12", minute: "00", ampm: "AM" as const };
  if (!iso) return def;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return def;
  const h24 = d.getHours();
  const ampm = h24 < 12 ? "AM" : "PM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm   = pad(d.getMonth() + 1);
  const dd   = pad(d.getDate());
  return { date: `${yyyy}-${mm}-${dd}`, hour: String(h12), minute: pad(d.getMinutes()), ampm };
}

/** Local parts → ISO UTC string */
function localToIso(date: string, hour: string, minute: string, ampm: "AM" | "PM"): string | null {
  if (!date) return null;
  let h = parseInt(hour, 10);
  const m = parseInt(minute, 10);
  if (isNaN(h) || isNaN(m) || h < 1 || h > 12 || m < 0 || m > 59) return null;
  if (ampm === "PM" && h !== 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  const d = new Date(`${date}T${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:00`);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

/** Pretty display of saved time */
function displayIso(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true
  });
}

export function BannerEditor({ initial }: Props) {
  const [form, setForm] = useState<Banner>(initial);
  const [status, setStatus] = useState<"idle" | "saving" | "ok" | "error">("idle");
  const [msg, setMsg] = useState("");
  const [uploading, setUploading] = useState(false);

  // datetime picker state
  const initParts = isoToLocal(initial.expires_at);
  const [dateVal, setDateVal]     = useState(initParts.date);
  const [hourVal, setHourVal]     = useState(initParts.hour);
  const [minuteVal, setMinuteVal] = useState(initParts.minute);
  const [ampm, setAmpm]           = useState<"AM" | "PM">(initParts.ampm);

  function updateExpiry(d: string, h: string, mi: string, ap: "AM" | "PM") {
    const iso = localToIso(d, h, mi, ap);
    update("expires_at", iso);
  }

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

      <div style={{ marginBottom: 16 }}>
        <span style={{ fontSize: 13, fontWeight: 550, color: "var(--muted)", display: "block", marginBottom: 8 }}>
          Countdown ends at *
        </span>
        <div className="banner-dt-row">
          <input
            type="date"
            className="banner-dt-date"
            value={dateVal}
            onChange={(e) => { setDateVal(e.target.value); updateExpiry(e.target.value, hourVal, minuteVal, ampm); }}
          />
          <input
            type="text"
            inputMode="numeric"
            className="banner-dt-hour"
            value={hourVal}
            maxLength={2}
            placeholder="12"
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, "").slice(0, 2);
              setHourVal(v);
              updateExpiry(dateVal, v, minuteVal, ampm);
            }}
          />
          <span className="banner-dt-sep">:</span>
          <input
            type="text"
            inputMode="numeric"
            className="banner-dt-min"
            value={minuteVal}
            maxLength={2}
            placeholder="00"
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, "").slice(0, 2);
              setMinuteVal(v);
              updateExpiry(dateVal, hourVal, v, ampm);
            }}
          />
          <button
            type="button"
            className="banner-dt-ampm"
            onClick={() => {
              const next = ampm === "AM" ? "PM" : "AM";
              setAmpm(next);
              updateExpiry(dateVal, hourVal, minuteVal, next);
            }}
          >
            {ampm}
          </button>
        </div>
        {form.expires_at && (
          <small className="field-hint" style={{ marginTop: 6, display: "block" }}>
            Saved as: <b>{displayIso(form.expires_at)}</b> (your local time)
          </small>
        )}
        <small className="field-hint">Banner tự ẩn khi hết giờ đếm ngược.</small>
      </div>

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
