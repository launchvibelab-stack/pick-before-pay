export type Niche = {
  id: string;
  name: string;
  slug: string;
  description: string;
  created_at: string;
};

export type IndexStatus = "pending" | "submitted" | "failed" | "skipped" | null;

export type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  niche_id: string | null;
  focus_keyword: string;
  affiliate_url: string | null;
  meta_title: string;
  meta_description: string;
  cover_url: string | null;
  published: boolean;
  scheduled_at?: string | null;
  indexed_at: string | null;
  index_status: IndexStatus;
  wordpress_posted_at?: string | null;
  wordpress_post_url?: string | null;
  created_at: string;
  updated_at: string;
};
