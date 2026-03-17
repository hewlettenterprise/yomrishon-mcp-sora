export interface Config {
  openaiApiKey: string | null;
  openaiBaseUrl: string;
  defaultModel: string;
  maxPollSeconds: number;
  pollIntervalMs: number;
  debug: boolean;
  allowedUploadDirs: string[];
  httpPort: number;
  httpHost: string;
}

export function loadConfig(): Config {
  // API key is optional at startup — clients provide their own key per request.
  const apiKey = process.env.OPENAI_API_KEY ?? null;

  return {
    openaiApiKey: apiKey,
    openaiBaseUrl: process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1",
    defaultModel: process.env.SORA_DEFAULT_MODEL ?? "sora-2",
    maxPollSeconds: parseInt(process.env.SORA_MAX_POLL_SECONDS ?? "300", 10),
    pollIntervalMs: parseInt(process.env.SORA_POLL_INTERVAL_MS ?? "5000", 10),
    debug: process.env.SORA_DEBUG === "true",
    allowedUploadDirs: (process.env.SORA_ALLOWED_UPLOAD_DIRS ?? "/tmp")
      .split(",")
      .map((d) => d.trim())
      .filter(Boolean),
    httpPort: parseInt(process.env.MCP_HTTP_PORT ?? "3000", 10),
    httpHost: process.env.MCP_HTTP_HOST ?? "127.0.0.1",
  };
}
