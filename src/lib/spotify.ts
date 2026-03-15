const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || import.meta.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || import.meta.env.SPOTIFY_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.SPOTIFY_REFRESH_TOKEN || import.meta.env.SPOTIFY_REFRESH_TOKEN;

const BASIC_AUTH = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
const TOKEN_URL = 'https://accounts.spotify.com/api/token';
const NOW_PLAYING_URL = 'https://api.spotify.com/v1/me/player/currently-playing';
const RECENTLY_PLAYED_URL = 'https://api.spotify.com/v1/me/player/recently-played?limit=1';

// Cache to avoid 429 rate limits
let recentCache: { data: SpotifyTrack | null; timestamp: number } = { data: null, timestamp: 0 };
const RECENT_CACHE_TTL = 120_000; // 2 minutes

let tokenCache: { token: string; expiresAt: number } = { token: '', expiresAt: 0 };

export interface SpotifyTrack {
  isPlaying: boolean;
  title: string;
  artist: string;
  album: string;
  albumArt: string;
  songUrl: string;
  progressMs: number;
  durationMs: number;
  contextName?: string;
  contextUrl?: string;
  contextType?: string;
}

async function getAccessToken(): Promise<string> {
  if (tokenCache.token && Date.now() < tokenCache.expiresAt) {
    return tokenCache.token;
  }

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${BASIC_AUTH}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: REFRESH_TOKEN,
    }),
  });

  const data = await res.json();
  tokenCache = { token: data.access_token, expiresAt: Date.now() + (data.expires_in - 60) * 1000 };
  return data.access_token;
}

export async function getNowPlaying(): Promise<SpotifyTrack | null> {
  try {
    const accessToken = await getAccessToken();

    // Try currently playing first
    const res = await fetch(NOW_PLAYING_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    // 204 = nothing playing right now
    if (res.status === 204) {
      return getRecentlyPlayed(accessToken);
    }

    if (!res.ok) return null;

    const data = await res.json();
    if (!data.item) {
      return getRecentlyPlayed(accessToken);
    }

    const result: SpotifyTrack = {
      isPlaying: data.is_playing ?? false,
      title: data.item.name,
      artist: data.item.artists.map((a: any) => a.name).join(', '),
      album: data.item.album.name,
      albumArt: data.item.album.images?.[1]?.url ?? data.item.album.images?.[0]?.url ?? '',
      songUrl: data.item.external_urls.spotify,
      progressMs: data.progress_ms ?? 0,
      durationMs: data.item.duration_ms ?? 0,
    };

    // Fetch context (playlist/album name)
    if (data.context) {
      const ctx = await resolveContext(accessToken, data.context);
      if (ctx) {
        result.contextName = ctx.name;
        result.contextUrl = ctx.url;
        result.contextType = ctx.type;
      }
    }

    return result;
  } catch (e) {
    console.error('Spotify error:', e);
    return null;
  }
}

async function resolveContext(accessToken: string, context: any): Promise<{ name: string; url: string; type: string } | null> {
  try {
    const type = context.type; // playlist, album, artist
    const uri = context.uri; // spotify:playlist:xxxxx
    const id = uri.split(':').pop();
    if (!id || !type) return null;

    let apiUrl = '';
    if (type === 'playlist') apiUrl = `https://api.spotify.com/v1/playlists/${id}?fields=name,external_urls`;
    else if (type === 'album') apiUrl = `https://api.spotify.com/v1/albums/${id}`;
    else if (type === 'artist') apiUrl = `https://api.spotify.com/v1/artists/${id}`;
    else return null;

    const res = await fetch(apiUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;

    const data = await res.json();
    return {
      name: data.name,
      url: data.external_urls?.spotify ?? '',
      type,
    };
  } catch {
    return null;
  }
}

async function getRecentlyPlayed(accessToken: string): Promise<SpotifyTrack | null> {
  // Return cached data if fresh enough
  if (recentCache.data && Date.now() - recentCache.timestamp < RECENT_CACHE_TTL) {
    return recentCache.data;
  }

  try {
    const res = await fetch(RECENTLY_PLAYED_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      if (res.status === 429 && recentCache.data) return recentCache.data;
      return null;
    }

    const data = await res.json();
    const item = data.items?.[0];
    const track = item?.track;
    if (!track) return null;

    const result: SpotifyTrack = {
      isPlaying: false,
      title: track.name,
      artist: track.artists.map((a: any) => a.name).join(', '),
      album: track.album.name,
      albumArt: track.album.images?.[1]?.url ?? track.album.images?.[0]?.url ?? '',
      songUrl: track.external_urls.spotify,
      progressMs: track.duration_ms ?? 0,
      durationMs: track.duration_ms ?? 0,
    };

    if (item.context) {
      const ctx = await resolveContext(accessToken, item.context);
      if (ctx) {
        result.contextName = ctx.name;
        result.contextUrl = ctx.url;
        result.contextType = ctx.type;
      }
    }

    recentCache = { data: result, timestamp: Date.now() };
    return result;
  } catch {
    if (recentCache.data) return recentCache.data;
    return null;
  }
}

export function getAuthUrl(redirectUri: string): string {
  const scopes = 'user-read-currently-playing user-read-recently-played';
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    scope: scopes,
    redirect_uri: redirectUri,
  });
  return `https://accounts.spotify.com/authorize?${params.toString()}`;
}

export async function getRefreshToken(code: string, redirectUri: string): Promise<string> {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${BASIC_AUTH}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
  });

  const data = await res.json();
  return data.refresh_token;
}
