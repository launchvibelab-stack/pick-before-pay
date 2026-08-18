import { isAdmin } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { PostEditor } from "@/components/PostEditor";
import { getNiches } from "@/lib/niches";
import { getPostById } from "@/lib/posts";

export const dynamic = "force-dynamic";

export default async function EditPost({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) redirect("/admin/login");
  const { id } = await params;
  const [post, niches] = await Promise.all([getPostById(id), getNiches()]);
  if (!post) notFound();

  return (
    <main className="admin-main">
      <div className="admin-title">
        <div>
          <p>CONTENT</p>
          <h1>Edit review</h1>
        </div>
      </div>
      <PostEditor key={post.id} niches={niches} post={post} />
    </main>
  );
}
