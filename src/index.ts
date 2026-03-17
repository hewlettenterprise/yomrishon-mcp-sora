#!/usr/bin/env node

import { loadConfig } from "./config.js";
import { createServer } from "./server.js";
import { startHttpServer } from "./http-server.js";

async function main(): Promise<void> {
  const config = loadConfig();
  const ctx = createServer(config);
  await startHttpServer(ctx, config);
}

main().catch((err) => {
  process.stderr.write(
    JSON.stringify({
      ts: new Date().toISOString(),
      level: "error",
      msg: "fatal_startup_error",
      data: { error: err instanceof Error ? err.message : String(err) },
    }) + "\n"
  );
  process.exit(1);
});
