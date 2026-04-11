import crypto from "crypto";

export function generateVerificationToken() {
  const token = crypto.randomBytes(32).toString("hex");

  const hashedToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 min

  return { token, hashedToken, expires };
}