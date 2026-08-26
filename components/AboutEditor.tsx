"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AboutProduct, AboutProfile } from "@/lib/about";

export function AboutEditor({ initial }: { initial: AboutProfile }) {
  const router = useRouter();
  const [form, setForm] = useState<AboutProfile>({
    ...initial,
    linkedin_url: initial.linkedin_url || "",
    youtube_url: initial.youtube_url || ""
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  function update<K extends keyof AboutProfile>(key: K, value: AboutProfile[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function updateProduct(i: number, patch: Partial<AboutProduct>) {
    setForm((f) => {
      const products = [...f.products];
      products[i] = { ...products[i], ...patch };
      return { ...f, products };
    });
  }

  function addProduct() {
    setForm((f) => ({
      ...f,
      products: [...f.products, { title: "", url: "", description: "" }]
    }));
  }

  async function uploadAvatar(file: File) {
    setUploadingAvatar(true);
    const fd = new FormData();
    fd.append("file", file);
    const r = await fetch("/api/upload", { method: "POST", body: fd });
    const j = await r.json();
    setUploadingAvatar(false);
    if (!r.ok) return alert(j.error || "Upload failed");
    update("avatar_url", j.url);
  }

  async function uploadProfileImage(file: File) {
    setUploadingProfile(true);
    const fd = new FormData();
    fd.append("file", file);
    const r = await fetch("/api/upload", { method: "POST", body: fd });
    const j = await r.json();
    setUploadingProfile(false);
    if (!r.ok) return alert(j.error || "Upload failed");
    update("profile_image_url", j.url);
  }

  function removeProduct(i: number) {
    setForm((f) => ({ ...f, products: f.products.filter((_, idx) => idx !== i) }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    try {
      const r = await fetch("/api/about", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form)
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setMsg(j.error || "Save failed");
        setLoading(false);
        return;
      }
      setForm({
        ...j,
        linkedin_url: j.linkedin_url || "",
        youtube_url: j.youtube_url || ""
      });
      setMsg("Saved.");
      router.refresh();
    } catch {
      setMsg("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="editor" onSubmit={onSubmit}>
      <label>
        Display name
        <input value={form.name} onChange={(e) => update("name", e.target.value)} required />
      </label>
      <label>
        Headline
        <input value={form.headline} onChange={(e) => update("headline", e.target.value)} />
      </label>
      <label>
        Bio
        <textarea rows={6} value={form.bio} onChange={(e) => update("bio", e.target.value)} />
      </label>
      <label className="upload">
        Avatar photo (circle on About page)
        <input
          type="file"
          accept="image/*"
          disabled={uploadingAvatar}
          onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])}
        />
        {uploadingAvatar && <span>Uploading…</span>}
        {!uploadingAvatar && form.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={form.avatar_url}
            alt="Avatar preview"
            style={{ width: 96, height: 96, objectFit: "cover", borderRadius: "50%", marginTop: 6 }}
          />
        ) : (
          !uploadingAvatar && <span>Upload a square photo (best: face close-up)</span>
        )}
        {form.avatar_url && (
          <button
            type="button"
            className="btn-ghost"
            style={{ marginTop: 8, padding: "4px 10px", fontSize: 12 }}
            onClick={() => update("avatar_url", null)}
          >
            Remove avatar
          </button>
        )}
      </label>
      <label>
        Or paste avatar image URL
        <input
          value={form.avatar_url || ""}
          onChange={(e) => update("avatar_url", e.target.value || null)}
          placeholder="https://… (direct image link ending in .jpg/.png)"
        />
        <small className="field-hint">
          Prefer upload above. Pasted links from Google Drive / Facebook often fail to display.
        </small>
      </label>

      <h3 className="editor-subhead">Social links</h3>
      <label>
        Facebook URL
        <input value={form.facebook_url} onChange={(e) => update("facebook_url", e.target.value)} />
      </label>
      <label>
        Pinterest URL
        <input value={form.pinterest_url} onChange={(e) => update("pinterest_url", e.target.value)} />
      </label>
      <label>
        Telegram URL
        <input value={form.telegram_url} onChange={(e) => update("telegram_url", e.target.value)} />
      </label>
      <label>
        LinkedIn URL
        <input value={form.linkedin_url || ""} onChange={(e) => update("linkedin_url", e.target.value)} />
      </label>
      <label>
        YouTube URL
        <input value={form.youtube_url || ""} onChange={(e) => update("youtube_url", e.target.value)} />
      </label>

      <h3 className="editor-subhead">My products</h3>

      <label className="upload">
        Profile image — 16:9 (optional)
        <input
          type="file"
          accept="image/*"
          disabled={uploadingProfile}
          onChange={(e) => e.target.files?.[0] && uploadProfileImage(e.target.files[0])}
        />
        {uploadingProfile && <span>Uploading…</span>}
        {!uploadingProfile && form.profile_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={form.profile_image_url}
            alt="Profile"
            style={{ aspectRatio: "16/9", objectFit: "cover", borderRadius: 8, marginTop: 6 }}
          />
        ) : (
          !uploadingProfile && <span>Hiển thị bên trên danh sách sản phẩm (tỉ lệ 16:9)</span>
        )}
        {form.profile_image_url && (
          <button
            type="button"
            className="btn-ghost"
            style={{ marginTop: 8, padding: "4px 10px", fontSize: 12 }}
            onClick={() => update("profile_image_url", null)}
          >
            Remove image
          </button>
        )}
      </label>
      {form.products.map((p, i) => (
        <div className="product-editor-row" key={i}>
          <label>
            Title
            <input value={p.title} onChange={(e) => updateProduct(i, { title: e.target.value })} />
          </label>
          <label>
            URL
            <input value={p.url} onChange={(e) => updateProduct(i, { url: e.target.value })} />
          </label>
          <label>
            Short description
            <input
              value={p.description || ""}
              onChange={(e) => updateProduct(i, { description: e.target.value })}
            />
          </label>
          <button type="button" className="btn-ghost" onClick={() => removeProduct(i)}>
            Remove
          </button>
        </div>
      ))}
      <button type="button" className="btn-ghost" onClick={addProduct}>
        + Add product
      </button>

      <button type="submit" className="primary-btn" disabled={loading} style={{ marginTop: 20 }}>
        {loading ? "Saving..." : "Save about page"}
      </button>
      {msg && <p className={`field-hint ${msg === "Saved." ? "" : "subscribe-msg is-error"}`}>{msg}</p>}
    </form>
  );
}
