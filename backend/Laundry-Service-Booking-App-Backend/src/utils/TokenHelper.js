
import jwt from "jsonwebtoken";
import crypto from "crypto";

// Access token — short-lived (default 1 h; override with JWT_ACCESS_EXPIRES_IN)
export const EncodeToken = (email, user_id) => {
  const key = process.env.JWT_SECRET;
  const expire = { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || process.env.JWT_SECRET_EXPIRES_IN || "1h" };
  const payload = { email, user_id };
  return jwt.sign(payload, key, expire);
};

export const DecodeToken = (token) => {
  try {
    const key = process.env.JWT_SECRET;
    return jwt.verify(token, key);
  } catch (error) {
    return null;
  }
};

// Refresh token — long-lived opaque token (stored in DB so it can be revoked)
export const GenerateRefreshToken = () => crypto.randomBytes(40).toString("hex");

// Hash a refresh token before storing in DB
export const HashRefreshToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

