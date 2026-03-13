export const prerender = false;

import type { APIRoute } from 'astro';
import { getAuthUrl } from '../../../lib/spotify';

export const GET: APIRoute = ({ url }) => {
  const redirectUri = `${url.origin}/api/spotify/callback`;
  const authUrl = getAuthUrl(redirectUri);
  return Response.redirect(authUrl);
};
