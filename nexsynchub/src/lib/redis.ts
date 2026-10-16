import {
  Redis,
} from "@upstash/redis";

// 🔥 Redis client
export const redis =
  new Redis({

    url:
      process.env
        .UPSTASH_REDIS_REST_URL || "https://dummy-redis.upstash.io",

    token:
      process.env
        .UPSTASH_REDIS_REST_TOKEN || "dummy_token_for_build",

  });