import Image from "next/image";
import Link from "next/link";

export function Header() {
  return (
    <header className="site-header">
      <div className="container nav-wrap">
        <Link href="/" className="brand" aria-label="PickBeforePay home" prefetch>
          <Image
            src="/logo.png"
            alt="PickBeforePay"
            width={32}
            height={32}
            className="brand-logo"
            priority
            sizes="32px"
          />
          <span>Pick</span>
          <b>BeforePay</b>
        </Link>
        <nav>
          <Link href="/">Home</Link>
          <Link href="/#niches">Niches</Link>
          <Link href="/#latest">Reviews</Link>
          <Link href="/about">About</Link>
        </nav>
      </div>
    </header>
  );
}
