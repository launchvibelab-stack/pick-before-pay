import Link from "next/link";

export function Header() {
  return (
    <header className="site-header">
      <div className="container nav-wrap">
        <Link href="/" className="brand">
          <span>Pick</span>
          <b>BeforePay</b>
        </Link>
        <nav>
          <Link href="/">Home</Link>
          <Link href="/#niches">Niches</Link>
          <Link href="/#latest">Reviews</Link>
          <Link href="/#about">About</Link>
        </nav>
        <Link href="/admin" className="write-btn">
          Dashboard
        </Link>
      </div>
    </header>
  );
}
