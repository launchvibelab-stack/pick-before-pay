import { BrandLogo } from "@/components/BrandLogo";
import Link from "next/link";

export function Header() {
  return (
    <header className="site-header">
      <div className="container nav-wrap">
        <BrandLogo />
        <nav>
          <Link href="/">Home</Link>
          <Link href="/#niches" prefetch={false}>
            Niches
          </Link>
          <Link href="/#latest" prefetch={false}>
            Reviews
          </Link>
          <Link href="/about">About</Link>
        </nav>
      </div>
    </header>
  );
}
