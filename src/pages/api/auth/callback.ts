export const prerender = false;

import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ url }) => {
  const code = url.searchParams.get('code');

  if (!code) {
    return new Response('Missing code parameter', { status: 400 });
  }

  const clientId = process.env.GITHUB_CLIENT_ID ?? '';
  const clientSecret = process.env.GITHUB_CLIENT_SECRET ?? '';

  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
    }),
  });

  const tokenData = await tokenRes.json();

  if (tokenData.error) {
    return new Response(`Auth error: ${tokenData.error_description}`, { status: 401 });
  }

  const token = tokenData.access_token;
  // Escape token for safe embedding in JS string literal
  const escapedToken = token.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

  const content = `<!DOCTYPE html>
<html>
<body>
<script>
(function() {
  var token = "${escapedToken}";
  var provider = "github";
  function receiveMessage(e) {
    window.opener.postMessage(
      "authorization:" + provider + ":success:" + JSON.stringify({ token: token, provider: provider }),
      e.origin
    );
    window.removeEventListener("message", receiveMessage, false);
  }
  window.addEventListener("message", receiveMessage, false);
  window.opener.postMessage("authorizing:" + provider, "*");
})();
</script>
</body>
</html>`;

  return new Response(content, {
    headers: { 'Content-Type': 'text/html' },
  });
};
