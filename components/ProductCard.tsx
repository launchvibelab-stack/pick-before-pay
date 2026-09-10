import Image from "next/image";
import type { AboutProduct } from "@/lib/about";

export function ProductCard({ product }: { product: AboutProduct }) {
  return (
    <a
      href={product.url}
      className="product-card"
      target="_blank"
      rel="nofollow sponsored noopener"
    >
      <span className="cover product-card-cover" aria-hidden>
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt=""
            fill
            sizes="(max-width: 700px) 100vw, 33vw"
            className="cover-img"
            loading="lazy"
          />
        ) : (
          <span>PRODUCT</span>
        )}
      </span>
      <span className="product-card-body">
        {product.marketplace && <span className="product-marketplace">{product.marketplace}</span>}
        <span className="product-card-title">{product.title}</span>
        {product.description && <span className="product-card-desc">{product.description}</span>}
        <span className="product-card-cta">View offer ↗</span>
      </span>
    </a>
  );
}
