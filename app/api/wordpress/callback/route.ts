import { NextResponse } from "next/server";

/**
 * OAuth redirect target for the WordPress.com developer app.
 * After authorize, WP sends ?code=... — exchange once for a Bearer token.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");

  if (error) {
    return new NextResponse(
      `<!doctype html><html><body style="font-family:system-ui;padding:32px;max-width:640px">
        <h1>WordPress.com auth failed</h1>
        <p><b>${error}</b></p>
        <p>${errorDescription || ""}</p>
      </body></html>`,
      { headers: { "content-type": "text/html; charset=utf-8" } }
    );
  }

  if (!code) {
    return new NextResponse(
      `<!doctype html><html><body style="font-family:system-ui;padding:32px;max-width:720px;line-height:1.5">
        <h1>WordPress.com callback</h1>
        <p>This URL is the Redirect URI for your PickBeforePay app.</p>
        <p>After you authorize, WordPress.com will return here with a <code>code</code>.</p>
      </body></html>`,
      { headers: { "content-type": "text/html; charset=utf-8" } }
    );
  }

  const clientId = process.env.WORDPRESS_COM_CLIENT_ID?.trim();
  const clientSecret = process.env.WORDPRESS_COM_CLIENT_SECRET?.trim();
  const redirectUri =
    process.env.WORDPRESS_COM_REDIRECT_URI?.trim() ||
    "https://pickbeforepay.com/api/wordpress/callback";

  if (!clientId || !clientSecret) {
    return new NextResponse(
      `<!doctype html><html><body style="font-family:system-ui;padding:32px;max-width:720px;line-height:1.5">
        <h1>Authorization code received</h1>
        <p>Copy this code, then exchange it for a token (or add CLIENT_ID / CLIENT_SECRET on Vercel and reload):</p>
        <pre style="white-space:pre-wrap;background:#f4f4f6;padding:16px;border-radius:12px">${code}</pre>
      </body></html>`,
      { headers: { "content-type": "text/html; charset=utf-8" } }
    );
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
    code
  });

  const tokenRes = await fetch("https://public-api.wordpress.com/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });
  const tokenText = await tokenRes.text();
  let tokenJson: { access_token?: string; blog_id?: string; blog_url?: string; error?: string } =
    {};
  try {
    tokenJson = JSON.parse(tokenText) as typeof tokenJson;
  } catch {
    /* ignore */
  }

  if (!tokenRes.ok || !tokenJson.access_token) {
    return new NextResponse(
      `<!doctype html><html><body style="font-family:system-ui;padding:32px;max-width:720px;line-height:1.5">
        <h1>Token exchange failed</h1>
        <pre style="white-space:pre-wrap;background:#f4f4f6;padding:16px;border-radius:12px">${tokenText.slice(0, 800)}</pre>
      </body></html>`,
      { headers: { "content-type": "text/html; charset=utf-8" } }
    );
  }

  const site =
    (tokenJson.blog_id && tokenJson.blog_id !== "0" && tokenJson.blog_id !== 0
      ? String(tokenJson.blog_id)
      : null) ||
    tokenJson.blog_url ||
    "your-site.wordpress.com";

  return new NextResponse(
    `<!doctype html><html><body style="font-family:system-ui;padding:32px;max-width:720px;line-height:1.5">
      <h1>WordPress.com connected</h1>
      <p>Copy these into Vercel env (Production), then redeploy:</p>
      <pre style="white-space:pre-wrap;background:#f4f4f6;padding:16px;border-radius:12px;user-select:all">WORDPRESS_COM_TOKEN=${tokenJson.access_token}
WORDPRESS_COM_SITE=${site}</pre>
      <p>Keep this token private. You can close this tab after saving.</p>
    </body></html>`,
    { headers: { "content-type": "text/html; charset=utf-8" } }
  );
}
