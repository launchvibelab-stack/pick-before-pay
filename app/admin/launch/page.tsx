import { LaunchEditor } from "@/components/LaunchEditor";
import { getLaunch } from "@/lib/launch";
import { isAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminLaunchPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  const launch = await getLaunch();

  return (
    <main className="admin-main">
      <div className="admin-title">
        <div>
          <p>MARKETING</p>
          <h1>Launch page</h1>
        </div>
      </div>
      <p className="field-hint" style={{ marginBottom: 20, maxWidth: 640 }}>
        Cấu hình riêng cho{" "}
        <a href="/launch" target="_blank" rel="noopener noreferrer">
          /launch
        </a>
        : thu email, hiện mã giảm giá, countdown, CTA. Không dùng chung với banner homepage.
      </p>
      <LaunchEditor initial={launch} />
    </main>
  );
}
