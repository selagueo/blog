export const prerender = false;

import type { APIRoute } from 'astro';
import { getNowPlaying } from '../../../lib/spotify';

export const GET: APIRoute = async () => {
  const track = await getNowPlaying();

  if (!track) {
    return new Response(JSON.stringify({ isPlaying: false }), {
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
};
