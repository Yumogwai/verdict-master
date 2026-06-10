// Verdict Master — tiny in-memory rate limiter for the generation routes.
// A debate costs one request per round plus one for the verdict, so 20/min per
// client comfortably covers real use while keeping a single leaked URL from
// burning the API key. Per-instance state: on serverless this is best-effort
// (each warm instance keeps its own window), which is the right trade-off for
// a demo — no external store required.

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 20;
const MAX_TRACKED = 2_000;

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

function prune(now: number) {
  if (buckets.size <= MAX_TRACKED) return;
  for (const [key, bucket] of buckets) {
    if (now >= bucket.resetAt) buckets.delete(key);
  }
}

export function rateLimit(id: string): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  prune(now);
  const bucket = buckets.get(id);
  if (!bucket || now >= bucket.resetAt) {
    buckets.set(id, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true };
  }
  bucket.count += 1;
  if (bucket.count > MAX_REQUESTS) {
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) };
  }
  return { ok: true };
}

/** Best-available client identity behind proxies/CDNs. */
export function clientId(req: { headers: { get(name: string): string | null } }): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "local";
}
