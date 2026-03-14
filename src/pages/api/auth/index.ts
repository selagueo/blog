export const prerender = false;

import type { APIRoute } from 'astro';

export const GET: APIRoute = () => {
  const clientId = process.env.GITHUB_CLIENT_ID ?? '';
  const scope = 'repo,user';
  const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=${scope}`;
  return new Response(null, {
    status: 302,
    headers: { Location: authUrl },
  });
};
