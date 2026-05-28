import crypto from "crypto";

const TOKEN_BYTES = 32;
const VERIFICATION_TOKEN_TTL_MS =
  24 * 60 * 60 * 1000;

export function hashNewsletterToken(token: string) {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}

export function createNewsletterVerificationToken() {
  const token = crypto
    .randomBytes(TOKEN_BYTES)
    .toString("hex");

  return {
    token,
    hashedToken: hashNewsletterToken(token),
    expiresAt: new Date(
      Date.now() + VERIFICATION_TOKEN_TTL_MS
    ),
  };
}

export function createNewsletterUnsubscribeToken() {
  const token = crypto
    .randomBytes(TOKEN_BYTES)
    .toString("hex");

  return {
    token,
    hashedToken: hashNewsletterToken(token),
  };
}
