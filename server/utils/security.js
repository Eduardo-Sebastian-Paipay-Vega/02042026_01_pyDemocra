import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { config } from "../config.js";

export const nowIso = () => new Date().toISOString();

export const getClientIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  const fromForwarded = Array.isArray(forwarded)
    ? forwarded[0]
    : String(forwarded || "").split(",")[0].trim();

  return fromForwarded || req.socket?.remoteAddress || null;
};

export const getClientCountry = (req) => {
  return (
    req.headers["x-vercel-ip-country"] ||
    req.headers["cf-ipcountry"] ||
    req.headers["x-country-code"] ||
    null
  );
};

export const maskIp = (ip) => {
  if (!ip) return null;
  const raw = String(ip);
  if (raw.includes(".")) {
    const parts = raw.split(".");
    if (parts.length === 4) return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
  }

  if (raw.includes(":")) {
    const parts = raw.split(":");
    return `${parts.slice(0, 4).join(":")}::`;
  }

  return "masked";
};

export const maskEmail = (email) => {
  if (!email) return null;
  const [user, domain] = String(email).split("@");
  if (!user || !domain) return "***";

  if (user.length <= 2) return `${user[0]}***@${domain}`;
  return `${user.slice(0, 2)}***@${domain}`;
};

export const hashOtp = ({ code, userId, tenantId }) => {
  return crypto
    .createHash("sha256")
    .update(`${code}:${userId}:${tenantId}:${config.otpPepper}`)
    .digest("hex");
};

export const generateOtpCode = () => {
  const random = crypto.randomInt(0, 1000000);
  return String(random).padStart(6, "0");
};

export const safeCompare = (valueA, valueB) => {
  const a = Buffer.from(String(valueA || ""));
  const b = Buffer.from(String(valueB || ""));

  if (a.length !== b.length) {
    return false;
  }

  return crypto.timingSafeEqual(a, b);
};

export const verifyPinHash = async ({ pin, pinHash }) => {
  if (!pinHash) return false;

  if (pinHash.startsWith("$2a$") || pinHash.startsWith("$2b$")) {
    return bcrypt.compare(pin, pinHash);
  }

  if (pinHash.startsWith("sha256:")) {
    const target = pinHash.replace("sha256:", "");
    const digest = crypto.createHash("sha256").update(pin).digest("hex");
    return safeCompare(digest, target);
  }

  return safeCompare(pin, pinHash);
};

export const sanitizeUserAgent = (userAgent) => {
  if (!userAgent) return null;
  return String(userAgent).slice(0, 240);
};

export const buildRetentionUntil = (days = 180) => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
};

export const normalizePermissionCandidates = (permission) => {
  if (!permission) return [];
  const trimmed = String(permission).trim();
  if (!trimmed) return [];

  const withoutPrefix = trimmed.replace(/^perm\./, "");
  if (withoutPrefix === trimmed) return [trimmed];
  return [trimmed, withoutPrefix];
};