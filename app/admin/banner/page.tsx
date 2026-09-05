import { BannerEditor } from "@/components/BannerEditor";
import { getBanner } from "@/lib/banner";
import { isAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminBannerPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  const banner = await getBanner();

  return (
    <main className="admin-main">
      <div className="admin-title">
        <div>
          <p>MARKETING</p>
          <h1>Promo Banner</h1>
        </div>
      </div>
      <p className="field-hint" style={{ marginBottom: 20, maxWidth: 640 }}>
        Banner trang chủ: ảnh + text + countdown + nút affiliate. Thu email nằm ở{" "}
        <a href="/admin/launch">Launch page</a>.
      </p>
      <BannerEditor initial={banner} />
    </main>
  );
}
