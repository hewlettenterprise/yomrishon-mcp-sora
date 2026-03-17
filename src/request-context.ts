import { AsyncLocalStorage } from "node:async_hooks";
import type { OpenAIClient } from "./openai-client.js";

/**
 * Per-request context.
 *
 * Each HTTP request may carry a different API key, so we store the
 * per-request client in AsyncLocalStorage and resolve it at tool-call time.
 */
export interface RequestContext {
  client: OpenAIClient;
}

const storage = new AsyncLocalStorage<RequestContext>();

/** Run a function with a per-request OpenAIClient. */
export function runWithClient<T>(
  client: OpenAIClient,
  fn: () => T
): T {
  return storage.run({ client }, fn);
}

/** Get the per-request client, or fall back to the provided default. */
export function getRequestClient(
  fallback: OpenAIClient | null
): OpenAIClient {
  const ctx = storage.getStore();
  if (ctx) return ctx.client;
  if (fallback) return fallback;
  throw new Error(
    "No OpenAI client available. In HTTP mode, requests must include " +
      "an Authorization header with a valid API key."
  );
}
