import type { APIRoute } from 'astro';

export const prerender = false;

async function getRedis() {
  const url = import.meta.env.UPSTASH_REDIS_REST_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = import.meta.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  const { redis } = await import('../../../lib/redis');
  return redis;
}

async function hashIP(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip);
  const hash = await crypto.subtle.digest('SHA-256', data);
  const bytes = new Uint8Array(hash);
  return Array.from(bytes.slice(0, 8))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export const GET: APIRoute = async ({ params }) => {
  const slug = params.slug;
  if (!slug) {
    return new Response(JSON.stringify({ error: 'Missing slug' }), { status: 400 });
  }

  try {
    const redis = await getRedis();
    if (!redis) return new Response(JSON.stringify({ views: 0 }), { headers: { 'Content-Type': 'application/json' } });
    const views = (await redis.get<number>(`views:${slug}`)) ?? 0;
    return new Response(JSON.stringify({ views }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ views: 0 }), { headers: { 'Content-Type': 'application/json' } });
  }
};

export const POST: APIRoute = async ({ params, request }) => {
  const slug = params.slug;
  if (!slug) {
    return new Response(JSON.stringify({ error: 'Missing slug' }), { status: 400 });
  }

  try {
    const redis = await getRedis();
    if (!redis) return new Response(JSON.stringify({ views: 0 }), { headers: { 'Content-Type': 'application/json' } });

    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded?.split(',')[0]?.trim() || 'unknown';
    const hashedIP = await hashIP(ip);

    const alreadyViewed = await redis.sismember(`viewers:${slug}`, hashedIP);

    if (!alreadyViewed) {
      await redis.sadd(`viewers:${slug}`, hashedIP);
      await redis.incr(`views:${slug}`);
    }

    const views = (await redis.get<number>(`views:${slug}`)) ?? 0;
    return new Response(JSON.stringify({ views }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ views: 0 }), { headers: { 'Content-Type': 'application/json' } });
  }
};
