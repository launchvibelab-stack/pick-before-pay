"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Niche, Post } from "@/lib/types";
import { slugify } from "@/lib/slugify";

type Props = {
  niches: Niche[];
  post?: Post;
};

function toDateInputValue(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  // Stored as YYYY-MM-DDT14:00:00.000Z for the intended calendar day
  return d.toISOString().slice(0, 10);
}

function todayDateInputValue() {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function PostEditor({ niches, post }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState<"draft" | "schedule" | "publish" | null>(null);
  const [cover, setCover] = useState(post?.cover_url || "");
  const [slug, setSlug] = useState(post?.slug || "");
  const [slugTouched, setSlugTouched] = useState(Boolean(post?.slug));
  const [scheduledDate, setScheduledDate] = useState(toDateInputValue(post?.scheduled_at));

  const minDate = useMemo(() => todayDateInputValue(), []);

  async function upload(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    const r = await fetch("/api/upload", { method: "POST", body: fd });
    const j = await r.json();
    if (!r.ok) return alert(j.error);
    setCover(j.url);
  }

  async function save(mode: "draft" | "schedule" | "publish") {
    const form = formRef.current;
    if (!form) return;
    if (!form.reportValidity()) return;

    if (mode === "schedule" && !scheduledDate) {
      alert("Pick a publish date.");
      return;
    }

    setLoading(mode);
    const fd = new FormData(form);
    const body = {
      title: String(fd.get("title") || ""),
      slug: String(fd.get("slug") || ""),
      excerpt: String(fd.get("excerpt") || ""),
      content: String(fd.get("content") || ""),
      niche_id: String(fd.get("niche_id") || ""),
      focus_keyword: String(fd.get("focus_keyword") || ""),
      affiliate_url: String(fd.get("affiliate_url") || ""),
      cover_url: cover,
      published: mode === "publish",
      scheduled_at: mode === "schedule" ? scheduledDate : null
    };

    const url = post ? `/api/posts/${post.id}` : "/api/posts";
    const method = post ? "PUT" : "POST";
    const r = await fetch(url, {
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    });
    const j = await r.json();
    setLoading(null);
    if (!r.ok) return alert(j.error || "Save failed");
    if (j.warning) alert(j.warning);
    else if (mode === "publish" && j.wordpress_posted) {
      alert(
        j.wordpress_post_url
          ? `Published. Satellite post live on WordPress.com:\n${j.wordpress_post_url}`
          : "Published. Satellite post queued on WordPress.com."
      );
    } else if (mode === "schedule") {
      alert(`Scheduled for ${scheduledDate}. It will go live around 21:00 Vietnam time that day.`);
    }
    router.push("/admin/posts");
    router.refresh();
  }

  if (!niches.length) {
    return (
      <div className="notice">
        Create at least one niche before publishing.{" "}
        <a href="/admin/niches" style={{ color: "var(--cyan)" }}>
          Manage niches →
        </a>
      </div>
    );
  }

  return (
    <form
      className="editor"
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault();
      }}
    >
      <label>
        Niche *
        <select name="niche_id" required defaultValue={post?.niche_id || ""}>
          <option value="">Select a niche</option>
          {niches.map((n) => (
            <option key={n.id} value={n.id}>
              {n.name}
            </option>
          ))}
        </select>
      </label>

      <label>
        Focus keyword *
        <input
          name="focus_keyword"
          required
          maxLength={120}
          defaultValue={post?.focus_keyword || ""}
          placeholder="e.g. best ai writing tools"
          onBlur={(e) => {
            if (!slugTouched) setSlug(slugify(e.currentTarget.value));
          }}
        />
      </label>

      <div className="two-col">
        <label>
          Title *
          <input name="title" required maxLength={200} defaultValue={post?.title || ""} />
        </label>
        <label>
          Slug (URL) *
          <input
            name="slug"
            required
            pattern="[a-z0-9-]+"
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
          />
        </label>
      </div>

      <label>
        Excerpt
        <textarea
          name="excerpt"
          rows={3}
          maxLength={300}
          defaultValue={post?.excerpt || ""}
          placeholder="Optional — auto-generated from content if empty"
        />
      </label>

      <label className="upload">
        Cover image
        <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
        {cover ? <img src={cover} alt="Cover preview" /> : <span>Choose an image to upload</span>}
      </label>

      <label>
        Content (Markdown) *
        <textarea
          className="content-area"
          name="content"
          required
          rows={18}
          defaultValue={post?.content || ""}
          placeholder={
            "Paste full review Markdown here.\nApp auto-handles: H1→H2 SEO, tables, YOUR_AFFILIATE_LINK → real URL, CTA buttons, FAQ schema."
          }
        />
        <small className="field-hint">
          Paste the full review as-is. Keep <code>YOUR_AFFILIATE_LINK</code> in links — it is replaced by the Affiliate URL
          below. On publish: tables, H1→H2, CTA buttons, FAQ schema, plus internal links. After Sinbyte succeeds, one
          WordPress.com companion post is created with a link back to this review.
        </small>
      </label>

      <label>
        Affiliate URL
        <input
          name="affiliate_url"
          type="url"
          defaultValue={post?.affiliate_url || ""}
          placeholder="https://warriorplus.com/..."
        />
        <small className="field-hint">
          Replaces every <code>YOUR_AFFILIATE_LINK</code> and turns those links into conversion buttons.
        </small>
      </label>

      <div className="schedule-box">
        <label>
          Schedule publish date
          <input
            type="date"
            min={minDate}
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
          />
        </label>
        <small className="field-hint">
          Only pick the <b>day</b> — no time needed. That day around <b>21:00 Vietnam time</b>, the system publishes all
          due posts. You can schedule many future days. <b>Publish now</b> still goes live immediately.
        </small>
      </div>

      <p className="field-hint editor-publish-hint">
        Save draft keeps it offline. Schedule = pick a date. Publish now = live immediately.
      </p>

      <div className="editor-actions">
        <button
          type="button"
          className="btn-ghost"
          disabled={loading !== null}
          onClick={() => save("draft")}
        >
          {loading === "draft" ? "Saving..." : "Save draft"}
        </button>
        <button
          type="button"
          className="btn-schedule"
          disabled={loading !== null}
          onClick={() => save("schedule")}
        >
          {loading === "schedule" ? "Scheduling..." : "Schedule"}
        </button>
        <button
          type="button"
          className="primary-btn"
          disabled={loading !== null}
          onClick={() => save("publish")}
        >
          {loading === "publish"
            ? "Publishing..."
            : post?.published
              ? "Update & keep published"
              : "Publish now"}
        </button>
      </div>
    </form>
  );
}
