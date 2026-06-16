import { redis } from "@/lib/redis";

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_SECONDS = 30 * 60;
const ATTEMPT_WINDOW_SECONDS = 30 * 60;

const normalizeIp = (ip: string) =>
  ip.trim().toLowerCase().replace(/[^a-z0-9:.\-]/g, "_") || "unknown";

const attemptKey = (ip: string) =>
  `auth:login:failed:${normalizeIp(ip)}`;

const lockKey = (ip: string) =>
  `auth:login:lock:${normalizeIp(ip)}`;

export async function getLoginIpLock(ip: string) {
  const ttl = await redis.ttl(lockKey(ip));

  return {
    locked: ttl > 0,
    retryAfterSeconds: Math.max(ttl, 0),
  };
}

export async function recordLoginFailure(ip: string) {
  const locked = await getLoginIpLock(ip);

  if (locked.locked) {
    return {
      locked: true,
      attempts: MAX_FAILED_ATTEMPTS + 1,
      retryAfterSeconds: locked.retryAfterSeconds,
    };
  }

  const key = attemptKey(ip);
  const attempts = await redis.incr(key);

  if (attempts === 1) {
    await redis.expire(key, ATTEMPT_WINDOW_SECONDS);
  }

  if (attempts > MAX_FAILED_ATTEMPTS) {
    await redis.set(lockKey(ip), "locked", { ex: LOCK_SECONDS });
    await redis.del(key);

    return {
      locked: true,
      attempts,
      retryAfterSeconds: LOCK_SECONDS,
    };
  }

  return {
    locked: false,
    attempts,
    retryAfterSeconds: 0,
  };
}

export async function clearLoginFailures(ip: string) {
  await Promise.all([
    redis.del(attemptKey(ip)),
    redis.del(lockKey(ip)),
  ]);
}

export function formatRetryAfter(seconds: number) {
  const minutes = Math.max(1, Math.ceil(seconds / 60));

  return `${minutes} minute${minutes === 1 ? "" : "s"}`;
}
