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
      <label>
        Avatar image URL
        <input
          value={form.avatar_url || ""}
          onChange={(e) => update("avatar_url", e.target.value || null)}
          placeholder="https://..."
        />
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
