import {
  pbkdf2Sync,
  randomBytes,
  timingSafeEqual,
  createHash,
} from "node:crypto";
export const tokenHash = (value) =>
  createHash("sha256").update(value).digest("hex");
export function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  return `600000$${salt}$${pbkdf2Sync(password, salt, 600000, 32, "sha256").toString("hex")}`;
}
export function verifyPassword(password, encoded) {
  try {
    const [iterations, salt, expected] = encoded.split("$");
    return timingSafeEqual(
      pbkdf2Sync(password, salt, Number(iterations), 32, "sha256"),
      Buffer.from(expected, "hex"),
    );
  } catch {
    return false;
  }
}
