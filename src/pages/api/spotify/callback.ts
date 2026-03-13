export const prerender = false;

import type { APIRoute } from 'astro';
import { getRefreshToken } from '../../../lib/spotify';

export const GET: APIRoute = async ({ url }) => {
  const code = url.searchParams.get('code');

  if (!code) {
    return new Response('Missing code parameter', { status: 400 });
  }

  const redirectUri = `${url.origin}/api/spotify/callback`;
  const refreshToken = await getRefreshToken(code, redirectUri);

  return new Response(
    `<html>
      <body style="font-family: system-ui; padding: 2rem; background: #111; color: #e5e5e5;">
        <h1>✅ Spotify conectado</h1>
        <p>Tu refresh token:</p>
        <code style="display: block; padding: 1rem; background: #1c1c1c; border-radius: 8px; word-break: break-all; margin: 1rem 0;">${refreshToken}</code>
        <p>Copiá este token y agregalo a tu <code>.env</code> como <code>SPOTIFY_REFRESH_TOKEN</code></p>
        <p><strong>Después reiniciá el servidor de desarrollo.</strong></p>
      </body>
    </html>`,
    { headers: { 'Content-Type': 'text/html' } }
  );
};
