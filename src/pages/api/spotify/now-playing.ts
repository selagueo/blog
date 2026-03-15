export const prerender = false;

import type { APIRoute } from 'astro';
import { getNowPlaying } from '../../../lib/spotify';

export const GET: APIRoute = async () => {
  const clientId = process.env.SPOTIFY_CLIENT_ID || import.meta.env.SPOTIFY_CLIENT_ID;
  const secret = process.env.SPOTIFY_CLIENT_SECRET || import.meta.env.SPOTIFY_CLIENT_SECRET;
  const refresh = process.env.SPOTIFY_REFRESH_TOKEN || import.meta.env.SPOTIFY_REFRESH_TOKEN;

  const debug: any = {
    hasClientId: !!clientId,
    hasSecret: !!secret,
    hasRefresh: !!refresh,
    clientIdLen: clientId?.length ?? 0,
    secretLen: secret?.length ?? 0,
    refreshLen: refresh?.length ?? 0,
    envSource: process.env.SPOTIFY_CLIENT_ID ? 'process.env' : import.meta.env.SPOTIFY_CLIENT_ID ? 'import.meta.env' : 'none',
  };

  try {
    const track = await getNowPlaying();
    debug.trackFound = !!track;

    if (!track) {
      return new Response(JSON.stringify({ isPlaying: false, debug }), {
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
    debug.error = e.message;
    debug.stack = e.stack?.split('\n').slice(0, 3);
    return new Response(JSON.stringify({ isPlaying: false, debug }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
