import { ProductCard } from "@/components/ProductCard";
import type { AboutProduct } from "@/lib/about";

export function WinningProducts({ products }: { products: AboutProduct[] }) {
  if (products.length === 0) return null;

  return (
    <section id="products" className="container section home-products">
      <div className="section-head">
        <span className="eyebrow">Products</span>
        <h2>My Winning Products</h2>
        <p className="home-products-lead">Tools and offers I stand behind - tap any card to open the offer.</p>
      </div>
      <div className="products-grid home-products-grid">
        {products.map((p) => (
          <ProductCard key={`${p.title}-${p.url}`} product={p} />
        ))}
      </div>
    </section>
  );
}
