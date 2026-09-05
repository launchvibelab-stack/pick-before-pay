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
        Homepage banner = nút affiliate thẳng (không form email). Thu email + mã giảm giá nằm ở trang{" "}
        <a href="/launch" target="_blank" rel="noopener noreferrer">
          /launch
        </a>{" "}
        (dùng chung cấu hình này). Cần CTA URL để banner hiện trên trang chủ.
      </p>
      <BannerEditor initial={banner} />
    </main>
  );
}
