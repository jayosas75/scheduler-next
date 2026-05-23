/**
 * Best-effort in-memory rate limiter (sliding window).
 *
 * Keyed by client IP + bucket name. Suitable for throttling auth endpoints
 * against rapid bursts. Note: on serverless (Vercel) state lives per warm
 * instance and resets on cold starts, so this is a deterrent, not a guarantee.
 */

interface Bucket {
    hits: number[];
}

const store = new Map<string, Bucket>();

// Drop empty/expired buckets periodically so the Map can't grow unbounded.
let lastSweep = Date.now();
const SWEEP_INTERVAL_MS = 60_000;

function sweep(windowMs: number) {
    const now = Date.now();
    if (now - lastSweep < SWEEP_INTERVAL_MS) return;
    lastSweep = now;
    for (const [key, bucket] of store) {
        bucket.hits = bucket.hits.filter(t => now - t < windowMs);
        if (bucket.hits.length === 0) store.delete(key);
    }
}

export function getClientIp(req: Request): string {
    const xff = req.headers.get('x-forwarded-for');
    if (xff) return xff.split(',')[0].trim();
    return req.headers.get('x-real-ip')?.trim() || 'unknown';
}

interface RateLimitResult {
    allowed: boolean;
    /** Seconds until the window frees up (only meaningful when blocked). */
    retryAfter: number;
}

/**
 * Records a hit and reports whether the caller is within the limit.
 *
 * @param key    Unique identifier, e.g. `login:1.2.3.4`.
 * @param limit  Max hits allowed within the window.
 * @param windowMs  Window size in milliseconds.
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
    sweep(windowMs);

    const now = Date.now();
    const bucket = store.get(key) ?? { hits: [] };
    bucket.hits = bucket.hits.filter(t => now - t < windowMs);

    if (bucket.hits.length >= limit) {
        const oldest = bucket.hits[0];
        const retryAfter = Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000));
        store.set(key, bucket);
        return { allowed: false, retryAfter };
    }

    bucket.hits.push(now);
    store.set(key, bucket);
    return { allowed: true, retryAfter: 0 };
}
