import Link from "next/link";
import type { Post } from "@/lib/types";

type Props = {
  nicheName: string;
  nicheSlug: string;
  posts: Pick<Post, "id" | "title" | "slug" | "excerpt" | "editor_score">[];
};

export function MoreInNiche({ nicheName, nicheSlug, posts }: Props) {
  if (posts.length === 0) return null;

  return (
    <section className="more-in-niche" aria-labelledby="more-in-niche-title">
      <div className="more-in-niche-head">
        <div>
          <p className="eyebrow">Same niche</p>
          <h2 id="more-in-niche-title">More in {nicheName}</h2>
        </div>
        <Link href={`/niche/${nicheSlug}`} className="more-in-niche-all">
          View all →
        </Link>
      </div>
      <ul className="more-in-niche-list">
        {posts.map((p) => (
          <li key={p.id}>
            <Link href={`/posts/${p.slug}`} className="more-in-niche-link">
              <span className="more-in-niche-title">{p.title}</span>
              {typeof p.editor_score === "number" && p.editor_score >= 1 && (
                <span className="more-in-niche-score">{Number(p.editor_score).toFixed(1)}/5</span>
              )}
              {p.excerpt && <span className="more-in-niche-excerpt">{p.excerpt}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
