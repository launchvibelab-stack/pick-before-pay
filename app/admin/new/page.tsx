import { isAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PostEditor } from "@/components/PostEditor";
import { getNiches } from "@/lib/niches";

export const dynamic = "force-dynamic";

export default async function NewPost() {
  if (!(await isAdmin())) redirect("/admin/login");
  const niches = await getNiches();
  return (
    <main className="admin-main">
      <div className="admin-title">
        <div>
          <p>CONTENT</p>
          <h1>New review</h1>
        </div>
      </div>
      <PostEditor niches={niches} />
    </main>
  );
}
