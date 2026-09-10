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
      <div className="about-products-grid home-products-grid">
        {products.map((p) => (
          <a
            key={`${p.title}-${p.url}`}
            href={p.url}
            className="about-product-tile"
            target="_blank"
            rel="nofollow sponsored noopener"
          >
            {p.marketplace && <span className="product-marketplace">{p.marketplace}</span>}
            <span className="about-product-tile-name">{p.title}</span>
            {p.description && <span className="about-product-tile-desc">{p.description}</span>}
            <span className="about-product-tile-arrow" aria-hidden>
              ↗
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
