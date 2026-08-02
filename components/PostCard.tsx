import Link from "next/link";
import Image from "next/image";
import type { Post } from "@/lib/types";

export function PostCard({ post }: { post: Post }) {
  return (
    <article className="post-card">
      <Link href={`/posts/${post.slug}`} className="cover">
        {post.cover_url ? (
          <Image
            src={post.cover_url}
            alt=""
            fill
            sizes="(max-width: 700px) 100vw, 33vw"
            className="cover-img"
            loading="lazy"
          />
        ) : (
          <span>REVIEW</span>
        )}
      </Link>
      <div className="post-body">
        <span className="category-pill">{post.category || "Review"}</span>
        <h2>
          <Link href={`/posts/${post.slug}`}>{post.title}</Link>
        </h2>
        <p>{post.excerpt}</p>
        <small>
          {new Date(post.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
          })}
        </small>
      </div>
    </article>
  );
}
