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

const headers = {
  apikey: key,
  Authorization: "Bearer " + key,
  "Content-Type": "application/json"
};

// Skip tiny same-session saves; catch scheduled gaps / later go-live.
const MIN_GAP_MS = 2 * 60 * 60 * 1000;

(async () => {
  const res = await fetch(
    url +
      "/rest/v1/posts?select=id,slug,title,published,created_at,updated_at&published=eq.true&order=created_at.desc",
    { headers: { apikey: key, Authorization: "Bearer " + key } }
  );
  if (!res.ok) {
    console.error("fetch failed", res.status, await res.text());
    process.exit(1);
  }
  const posts = await res.json();
  console.log("published_total=" + posts.length);

  let updated = 0;
  let skipped = 0;

  for (const p of posts) {
    const created = Date.parse(p.created_at);
    const updatedAt = Date.parse(p.updated_at);
    if (!Number.isFinite(created) || !Number.isFinite(updatedAt)) {
      console.log("skip_bad_date " + p.slug);
      skipped += 1;
      continue;
    }
    const gap = updatedAt - created;
    if (gap < MIN_GAP_MS) {
      console.log(
        "skip_small_gap " +
          p.slug +
          " created=" +
          p.created_at.slice(0, 10) +
          " updated=" +
          p.updated_at.slice(0, 10)
      );
      skipped += 1;
      continue;
    }

    const patch = await fetch(url + "/rest/v1/posts?id=eq." + p.id, {
      method: "PATCH",
      headers: { ...headers, Prefer: "return=minimal" },
      body: JSON.stringify({ created_at: p.updated_at })
    });
    if (!patch.ok) {
      console.error("fail " + p.slug, patch.status, await patch.text());
      continue;
    }
    updated += 1;
    console.log(
      "ok " +
        p.slug +
        " " +
        p.created_at.slice(0, 10) +
        " -> " +
        p.updated_at.slice(0, 10) +
        " gap_h=" +
        Math.round(gap / 3600000)
    );
  }

  console.log("DONE updated=" + updated + " skipped=" + skipped);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
