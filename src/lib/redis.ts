import { Redis } from '@upstash/redis';

const url = import.meta.env.UPSTASH_REDIS_REST_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const token = import.meta.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

export const redis = new Redis({ url: url!, token: token! });
