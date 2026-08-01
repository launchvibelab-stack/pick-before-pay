"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Niche, Post } from "@/lib/types";
import { slugify } from "@/lib/slugify";

type Props = {
  niches: Niche[];
  post?: Post;
};

export function PostEditor({ niches, post }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [cover, setCover] = useState(post?.cover_url || "");
  const [slug, setSlug] = useState(post?.slug || "");
  const [slugTouched, setSlugTouched] = useState(Boolean(post?.slug));

  async function upload(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    const r = await fetch("/api/upload", { method: "POST", body: fd });
    const j = await r.json();
    if (!r.ok) return alert(j.error);
    setCover(j.url);
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const body = {
      title: String(fd.get("title") || ""),
      slug: String(fd.get("slug") || ""),
      excerpt: String(fd.get("excerpt") || ""),
      content: String(fd.get("content") || ""),
      niche_id: String(fd.get("niche_id") || ""),
      focus_keyword: String(fd.get("focus_keyword") || ""),
      affiliate_url: String(fd.get("affiliate_url") || ""),
      cover_url: cover,
      published: fd.get("published") === "true"
    };

    const url = post ? `/api/posts/${post.id}` : "/api/posts";
    const method = post ? "PUT" : "POST";
    const r = await fetch(url, {
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    });
    const j = await r.json();
    setLoading(false);
    if (!r.ok) return alert(j.error || "Save failed");
    if (j.warning) alert(j.warning);
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
    <form className="editor" onSubmit={submit}>
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
          placeholder={"## Quick verdict\n\nPaste your review content here..."}
        />
      </label>

      <label>
        Affiliate URL
        <input
          name="affiliate_url"
          type="url"
          defaultValue={post?.affiliate_url || ""}
          placeholder="https://..."
        />
      </label>

      <label className="check">
        <input type="checkbox" name="published" value="true" defaultChecked={post?.published ?? true} />
        Publish now (submits URL to Sinbyte when published)
      </label>

      <button className="primary-btn" disabled={loading}>
        {loading ? "Saving..." : post ? "Update post" : "Publish post"}
      </button>
    </form>
  );
}
