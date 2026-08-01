import { isAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getNiches } from "@/lib/niches";
import { NicheManager } from "@/components/NicheManager";

export const dynamic = "force-dynamic";

export default async function NichesPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  const niches = await getNiches();
  return (
    <main className="admin-main">
      <div className="admin-title">
        <div>
          <p>TAXONOMY</p>
          <h1>Niches</h1>
        </div>
      </div>
      <NicheManager niches={niches} />
    </main>
  );
}
