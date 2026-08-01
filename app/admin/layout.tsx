import Link from "next/link";
import { isAdmin } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const authed = await isAdmin();
  return (
    <div className="admin-shell">
      <header className="admin-header">
        <Link href="/" className="brand">
          <span>Pick</span>
          <b>BeforePay</b>
        </Link>
        {authed && (
          <nav>
            <Link href="/admin">Overview</Link>
            <Link href="/admin/posts">Posts</Link>
            <Link href="/admin/niches">Niches</Link>
            <Link href="/admin/new">New post</Link>
            <form action="/api/auth/logout" method="post">
              <button>Log out</button>
            </form>
          </nav>
        )}
      </header>
      {children}
    </div>
  );
}
