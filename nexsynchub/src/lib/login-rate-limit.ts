import { redis } from "@/lib/redis";

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_SECONDS = 30 * 60; // 30 minutes
const ATTEMPT_WINDOW_SECONDS = 30 * 60; // 30 minutes

const normalizeIp = (ip: string) =>
  ip.trim().toLowerCase().replace(/[^a-z0-9:.\-]/g, "_") || "unknown";

const normalizeEmail = (email: string) =>
  email.trim().toLowerCase().replace(/[^a-z0-9@.\-_]/g, "_") || "unknown";

const attemptKey = (ip: string) =>
  `auth:login:failed:${normalizeIp(ip)}`;

const lockKey = (ip: string) =>
  `auth:login:lock:${normalizeIp(ip)}`;

const emailAttemptKey = (email: string) =>
  `auth:login:email:failed:${normalizeEmail(email)}`;

const emailLockKey = (email: string) =>
  `auth:login:email:lock:${normalizeEmail(email)}`;

export async function getLoginIpLock(ip: string) {
  const ttl = await redis.ttl(lockKey(ip));

  return {
    locked: ttl > 0,
    retryAfterSeconds: Math.max(ttl, 0),
  };
}

export async function getLoginEmailLock(email: string) {
  const ttl = await redis.ttl(emailLockKey(email));

  return {
    locked: ttl > 0,
    retryAfterSeconds: Math.max(ttl, 0),
  };
}

export async function recordLoginFailure(ip: string, email: string) {
  const [ipLock, emailLock] = await Promise.all([
    getLoginIpLock(ip),
    getLoginEmailLock(email),
  ]);

  if (ipLock.locked || emailLock.locked) {
    return {
      locked: true,
      attempts: MAX_FAILED_ATTEMPTS + 1,
      retryAfterSeconds: Math.max(ipLock.retryAfterSeconds, emailLock.retryAfterSeconds),
    };
  }

  const ipKey = attemptKey(ip);
  const emailKey = emailAttemptKey(email);

  const [ipAttempts, emailAttempts] = await Promise.all([
    redis.incr(ipKey),
    redis.incr(emailKey),
  ]);

  if (ipAttempts === 1) {
    await redis.expire(ipKey, ATTEMPT_WINDOW_SECONDS);
  }
  if (emailAttempts === 1) {
    await redis.expire(emailKey, ATTEMPT_WINDOW_SECONDS);
  }

  let isLocked = false;
  let lockTtl = 0;

  const promises = [];

  if (ipAttempts > MAX_FAILED_ATTEMPTS) {
    isLocked = true;
    lockTtl = LOCK_SECONDS;
    promises.push(
      redis.set(lockKey(ip), "locked", { ex: LOCK_SECONDS }),
      redis.del(ipKey)
    );
  }

  if (emailAttempts > MAX_FAILED_ATTEMPTS) {
    isLocked = true;
    lockTtl = LOCK_SECONDS;
    promises.push(
      redis.set(emailLockKey(email), "locked", { ex: LOCK_SECONDS }),
      redis.del(emailKey)
    );
  }

  if (promises.length > 0) {
    await Promise.all(promises);
  }

  return {
    locked: isLocked,
    attempts: Math.max(ipAttempts, emailAttempts),
    retryAfterSeconds: isLocked ? lockTtl : 0,
  };
}

export async function clearLoginFailures(ip: string, email: string) {
  await Promise.all([
    redis.del(attemptKey(ip)),
    redis.del(lockKey(ip)),
    redis.del(emailAttemptKey(email)),
    redis.del(emailLockKey(email)),
  ]);
}

export function formatRetryAfter(seconds: number) {
  const minutes = Math.max(1, Math.ceil(seconds / 60));

  return `${minutes} minute${minutes === 1 ? "" : "s"}`;
}
