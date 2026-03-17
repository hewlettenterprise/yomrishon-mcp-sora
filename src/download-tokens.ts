import { randomBytes } from "node:crypto";

export interface DownloadToken {
  videoId: string;
  apiKey: string;
  baseUrl: string;
  expiresAt: number;
}

const tokens = new Map<string, DownloadToken>();

const TOKEN_TTL_MS = 10 * 60 * 1000; // 10 minutes
const CLEANUP_INTERVAL_MS = 60 * 1000; // sweep every minute

/** Periodically remove expired tokens. */
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of tokens) {
    if (entry.expiresAt <= now) tokens.delete(key);
  }
}, CLEANUP_INTERVAL_MS);
cleanupTimer.unref();

/** Create a short-lived download token for a video. */
export function createDownloadToken(
  videoId: string,
  apiKey: string,
  baseUrl: string
): string {
  const token = randomBytes(32).toString("hex");
  tokens.set(token, {
    videoId,
    apiKey,
    baseUrl: baseUrl.replace(/\/+$/, ""),
    expiresAt: Date.now() + TOKEN_TTL_MS,
  });
  return token;
}

/** Consume (one-time use) a download token. Returns null if invalid/expired. */
export function consumeDownloadToken(token: string): DownloadToken | null {
  const entry = tokens.get(token);
  if (!entry) return null;
  tokens.delete(token);
  if (entry.expiresAt <= Date.now()) return null;
  return entry;
}
