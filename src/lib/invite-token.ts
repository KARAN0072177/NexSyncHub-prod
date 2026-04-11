import crypto from "crypto";

export function generateInviteToken() {
  return crypto.randomBytes(32).toString("hex");
}