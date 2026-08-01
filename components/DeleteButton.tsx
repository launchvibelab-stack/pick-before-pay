"use client";

import { useRouter } from "next/navigation";

export function DeleteButton({ id }: { id: string }) {
  const r = useRouter();
  return (
    <button
      className="danger"
      onClick={async () => {
        if (!confirm("Delete this post?")) return;
        await fetch(`/api/posts/${id}`, { method: "DELETE" });
        r.refresh();
      }}
    >
      Delete
    </button>
  );
}
