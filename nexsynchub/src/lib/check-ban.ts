import User from "@/models/User";

type BanPayload = {
  code: "ACCOUNT_BANNED";
  reason: string;
  expiresAt: Date | string | null;
};

type CachedBanState = {
  expiresAt: number;
  payload: BanPayload | null;
};

type BanLookupUser = {
  isBanned?: boolean;
  banReason?: string | null;
  banExpiresAt?: Date | string | null;
};

const BAN_CACHE_TTL_MS = 30_000;
const banCache = new Map<string, CachedBanState>();

function throwBan(payload: BanPayload): never {
  throw new Error(JSON.stringify(payload));
}

export function clearBanCacheForUser(userId: string) {
  banCache.delete(userId);
}

export async function checkBan(userId: string) {
  const now = Date.now();
  const cached = banCache.get(userId);

  if (cached && cached.expiresAt > now) {
    if (cached.payload) {
      throwBan(cached.payload);
    }

    return;
  }

  const user = await User.findById(userId)
    .select("isBanned banReason banExpiresAt")
    .lean<BanLookupUser | null>();

  if (!user) {
    throw new Error("User not found");
  }

  if (!user.isBanned) {
    banCache.set(userId, {
      expiresAt: now + BAN_CACHE_TTL_MS,
      payload: null,
    });

    return;
  }

  if (user.banExpiresAt && new Date() > new Date(user.banExpiresAt)) {
    await User.updateOne(
      { _id: userId },
      {
        $set: {
          isBanned: false,
          banReason: "",
          banExpiresAt: null,
          bannedBy: null,
        },
      }
    );

    banCache.set(userId, {
      expiresAt: now + BAN_CACHE_TTL_MS,
      payload: null,
    });

    return;
  }

  const payload: BanPayload = {
    code: "ACCOUNT_BANNED",
    reason: user.banReason || "Your account violated platform guidelines.",
    expiresAt: user.banExpiresAt || null,
  };

  banCache.set(userId, {
    expiresAt: now + BAN_CACHE_TTL_MS,
    payload,
  });

  throwBan(payload);
}
