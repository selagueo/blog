const CLIENT_ID = import.meta.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.SPOTIFY_CLIENT_SECRET;
const REFRESH_TOKEN = import.meta.env.SPOTIFY_REFRESH_TOKEN;

const BASIC_AUTH = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
const TOKEN_URL = 'https://accounts.spotify.com/api/token';
const NOW_PLAYING_URL = 'https://api.spotify.com/v1/me/player/currently-playing';
const RECENTLY_PLAYED_URL = 'https://api.spotify.com/v1/me/player/recently-played?limit=1';

export interface SpotifyTrack {
  isPlaying: boolean;
  title: string;
  artist: string;
  album: string;
  albumArt: string;
  songUrl: string;
  progressMs: number;
  durationMs: number;
}

async function getAccessToken(): Promise<string> {
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

    return {
      isPlaying: data.is_playing ?? false,
      title: data.item.name,
      artist: data.item.artists.map((a: any) => a.name).join(', '),
      album: data.item.album.name,
      albumArt: data.item.album.images?.[1]?.url ?? data.item.album.images?.[0]?.url ?? '',
      songUrl: data.item.external_urls.spotify,
      progressMs: data.progress_ms ?? 0,
      durationMs: data.item.duration_ms ?? 0,
    };
  } catch (e) {
    console.error('Spotify error:', e);
    return null;
  }
}

async function getRecentlyPlayed(accessToken: string): Promise<SpotifyTrack | null> {
  try {
    const res = await fetch(RECENTLY_PLAYED_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) return null;

    const data = await res.json();
    const track = data.items?.[0]?.track;
    if (!track) return null;

    return {
      isPlaying: false,
      title: track.name,
      artist: track.artists.map((a: any) => a.name).join(', '),
      album: track.album.name,
      albumArt: track.album.images?.[1]?.url ?? track.album.images?.[0]?.url ?? '',
      songUrl: track.external_urls.spotify,
      progressMs: track.duration_ms ?? 0,
      durationMs: track.duration_ms ?? 0,
    };
  } catch {
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
