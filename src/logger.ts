import type { Config } from "./config.js";

export type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

export class Logger {
  private minLevel: number;

  constructor(private config: Pick<Config, "debug">) {
    this.minLevel = config.debug ? 0 : 1;
  }

  private emit(
    level: LogLevel,
    message: string,
    data?: Record<string, unknown>
  ): void {
    if (LEVEL_ORDER[level] < this.minLevel) return;
    const entry: Record<string, unknown> = {
      ts: new Date().toISOString(),
      level,
      msg: message,
    };
    if (data) {
      entry.data = this.redact(data);
    }
    // Write structured logs to stderr
    process.stderr.write(JSON.stringify(entry) + "\n");
  }

  private redact(
    data: Record<string, unknown>
  ): Record<string, unknown> {
    const redacted: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (/key|token|secret|auth|bearer|password/i.test(key)) {
        redacted[key] = "[REDACTED]";
      } else if (
        typeof value === "string" &&
        /^(sk-|Bearer )/i.test(value)
      ) {
        redacted[key] = "[REDACTED]";
      } else if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ) {
        redacted[key] = this.redact(value as Record<string, unknown>);
      } else {
        redacted[key] = value;
      }
    }
    return redacted;
  }

  debug(msg: string, data?: Record<string, unknown>): void {
    this.emit("debug", msg, data);
  }

  info(msg: string, data?: Record<string, unknown>): void {
    this.emit("info", msg, data);
  }

  warn(msg: string, data?: Record<string, unknown>): void {
    this.emit("warn", msg, data);
  }

  error(msg: string, data?: Record<string, unknown>): void {
    this.emit("error", msg, data);
  }
}
