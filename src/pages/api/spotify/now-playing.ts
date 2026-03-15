export const prerender = false;

import type { APIRoute } from 'astro';
import { getNowPlaying } from '../../../lib/spotify';

export const GET: APIRoute = async () => {
  const hasClientId = !!(process.env.SPOTIFY_CLIENT_ID || import.meta.env.SPOTIFY_CLIENT_ID);
  const hasSecret = !!(process.env.SPOTIFY_CLIENT_SECRET || import.meta.env.SPOTIFY_CLIENT_SECRET);
  const hasRefresh = !!(process.env.SPOTIFY_REFRESH_TOKEN || import.meta.env.SPOTIFY_REFRESH_TOKEN);

  try {
    const track = await getNowPlaying();

    if (!track) {
      return new Response(JSON.stringify({ isPlaying: false, debug: { hasClientId, hasSecret, hasRefresh } }), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 's-maxage=10, stale-while-revalidate=5',
        },
      });
    }

    return new Response(JSON.stringify(track), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 's-maxage=10, stale-while-revalidate=5',
      },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ isPlaying: false, error: e.message, debug: { hasClientId, hasSecret, hasRefresh } }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
