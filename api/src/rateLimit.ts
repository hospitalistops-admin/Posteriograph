const buckets = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  limitPerMinute: number
): { allowed: boolean; retryAfterSec?: number } {
  const now = Date.now();
  const windowMs = 60_000;
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (bucket.count >= limitPerMinute) {
    return { allowed: false, retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count += 1;
  return { allowed: true };
}

export function clientKeyFromRequest(req: { headers: { "x-forwarded-for"?: string } }, ip?: string): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  return ip ?? "unknown";
}

/** Test helper */
export function resetRateLimits(): void {
  buckets.clear();
}
