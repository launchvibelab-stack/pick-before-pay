const fs = require("fs");
const path = require("path");

const envPath = path.join(process.cwd(), ".env.local");
const env = Object.fromEntries(
  fs
    .readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .filter((l) => !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1)];
    })
);

const url = env.SUPABASE_URL;
const key = env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  console.error("missing supabase env");
  process.exit(1);
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function migrateContent(content, affiliateUrl) {
  if (!content || !affiliateUrl) return { content, changes: 0 };
  const aff = affiliateUrl.trim();
  let out = content;
  let changes = 0;

  // [exactAff](exactAff) -> [Get started](exactAff)
  const naked = new RegExp("\\[" + escapeRe(aff) + "\\]\\(" + escapeRe(aff) + "\\)", "g");
  out = out.replace(naked, () => {
    changes += 1;
    return "[Get started](" + aff + ")";
  });

  // [exactAff](anyHref) -> [Get started](anyHref)
  const labelOnly = new RegExp("\\[" + escapeRe(aff) + "\\]\\(([^)]+)\\)", "g");
  out = out.replace(labelOnly, (full, href) => {
    if (full.startsWith("[Get started]")) return full;
    changes += 1;
    return "[Get started](" + href + ")";
  });

  return { content: out, changes };
}

(async () => {
  const listRes = await fetch(
    url + "/rest/v1/posts?select=id,slug,title,affiliate_url,content,published&order=created_at.desc",
    {
      headers: {
        apikey: key,
        Authorization: "Bearer " + key
      }
    }
  );
  if (!listRes.ok) {
    console.error("fetch failed", listRes.status, await listRes.text());
    process.exit(1);
  }
  const posts = await listRes.json();
  console.log("posts_total=" + posts.length);

  let updated = 0;
  let totalChanges = 0;
  for (const p of posts) {
    const aff = (p.affiliate_url || "").trim();
    if (!aff) {
      console.log("skip_no_aff " + p.slug);
      continue;
    }
    const { content, changes } = migrateContent(p.content || "", aff);
    if (!changes || content === p.content) {
      console.log("skip_no_change " + p.slug);
      continue;
    }
    const patch = await fetch(url + "/rest/v1/posts?id=eq." + p.id, {
      method: "PATCH",
      headers: {
        apikey: key,
        Authorization: "Bearer " + key,
        "Content-Type": "application/json",
        Prefer: "return=minimal"
      },
      body: JSON.stringify({
        content,
        updated_at: new Date().toISOString()
      })
    });
    if (!patch.ok) {
      console.error("fail " + p.slug, patch.status, await patch.text());
      continue;
    }
    updated += 1;
    totalChanges += changes;
    console.log("ok " + (p.published ? "live" : "draft") + " " + p.slug + " changes=" + changes);
  }
  console.log("DONE updated_posts=" + updated + " link_fixes=" + totalChanges);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
