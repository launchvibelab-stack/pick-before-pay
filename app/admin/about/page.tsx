import { AboutEditor } from "@/components/AboutEditor";
import { getAboutProfile } from "@/lib/about";
import { isAdmin } from "@/lib/auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminAboutPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  const profile = await getAboutProfile();

  return (
    <main className="admin-main">
      <div className="admin-title">
        <div>
          <p>CONTENT CMS</p>
          <h1>About page</h1>
        </div>
        <Link className="btn-ghost" href="/about" target="_blank">
          View public page →
        </Link>
      </div>
      <AboutEditor initial={profile} />
    </main>
  );
}
