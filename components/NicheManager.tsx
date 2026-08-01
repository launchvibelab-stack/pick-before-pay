"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Niche } from "@/lib/types";
import { slugify } from "@/lib/slugify";

export function NicheManager({ niches }: { niches: Niche[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Niche | null>(null);

  async function createNiche(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const r = await fetch("/api/niches", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, description, slug: slugify(name) })
    });
    const j = await r.json();
    setLoading(false);
    if (!r.ok) return alert(j.error);
    setName("");
    setDescription("");
    router.refresh();
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setLoading(true);
    const r = await fetch(`/api/niches/${editing.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: editing.name,
        description: editing.description,
        slug: slugify(editing.slug || editing.name)
      })
    });
    const j = await r.json();
    setLoading(false);
    if (!r.ok) return alert(j.error);
    setEditing(null);
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("Delete this niche?")) return;
    const r = await fetch(`/api/niches/${id}`, { method: "DELETE" });
    const j = await r.json();
    if (!r.ok) return alert(j.error);
    router.refresh();
  }

  return (
    <div className="niche-manager">
      <form className="editor" onSubmit={createNiche} style={{ marginBottom: 24 }}>
        <h2 style={{ marginTop: 0 }}>Add niche</h2>
        <div className="two-col">
          <label>
            Name *
            <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} />
          </label>
          <label>
            Slug preview
            <input value={slugify(name) || "—"} readOnly />
          </label>
        </div>
        <label>
          Description
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
        </label>
        <button className="primary-btn" disabled={loading}>
          {loading ? "Saving..." : "Add niche"}
        </button>
      </form>

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Slug</th>
              <th>Description</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {niches.map((n) => (
              <tr key={n.id}>
                <td>
                  <b>{n.name}</b>
                </td>
                <td>
                  <small>/{n.slug}</small>
                </td>
                <td>{n.description || "—"}</td>
                <td style={{ display: "flex", gap: 8 }}>
                  <button type="button" className="primary-btn" style={{ padding: "7px 10px" }} onClick={() => setEditing(n)}>
                    Edit
                  </button>
                  <button type="button" className="danger" onClick={() => remove(n.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!niches.length && <div className="empty">No niches yet. Add your first niche above.</div>}
      </div>

      {editing && (
        <div className="modal-backdrop" onClick={() => setEditing(null)}>
          <form className="editor modal-card" onClick={(e) => e.stopPropagation()} onSubmit={saveEdit}>
            <h2 style={{ marginTop: 0 }}>Edit niche</h2>
            <label>
              Name *
              <input
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                required
              />
            </label>
            <label>
              Slug *
              <input
                value={editing.slug}
                onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                required
                pattern="[a-z0-9-]+"
              />
            </label>
            <label>
              Description
              <textarea
                value={editing.description}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                rows={3}
              />
            </label>
            <div style={{ display: "flex", gap: 12 }}>
              <button className="primary-btn" disabled={loading}>
                Save
              </button>
              <button type="button" className="danger" onClick={() => setEditing(null)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
