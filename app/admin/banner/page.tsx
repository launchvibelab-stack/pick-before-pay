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
      <p className="field-hint" style={{ marginBottom: 20, maxWidth: 560 }}>
        Dải banner nằm dưới header trên trang chủ. Bật/tắt, đặt thời gian đếm ngược, thu email và
        hiện mã giảm giá sau khi người dùng đăng ký.
      </p>
      <BannerEditor initial={banner} />
    </main>
  );
}
