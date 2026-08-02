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
      <p className="card-lead" style={{ marginBottom: 18 }}>
        Edit your profile, social links, and product list shown on /about. Run{" "}
        <code>supabase/migration_about.sql</code> once if saving fails.
      </p>
      <AboutEditor initial={profile} />
    </main>
  );
}
