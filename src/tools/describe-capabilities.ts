import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { OpenAIClient } from "../openai-client.js";
import type { Config } from "../config.js";
import type { Logger } from "../logger.js";
import { getCapabilitySummary } from "../capabilities.js";
import { formatErrorForMcp } from "../errors.js";

export function register(
  server: McpServer,
  _client: OpenAIClient,
  _config: Config,
  _logger: Logger
): void {
  server.registerTool(
    "sora_describe_capabilities",
    {
      description:
        "Return the current capability registry showing all supported models, resolutions, " +
        "durations, and feature support (characters, image references, edits, extensions, remix). " +
        "Use this tool FIRST to understand what parameter values are valid before calling other " +
        "Sora tools. This is the canonical source of truth for model capabilities.",
    },
    async () => {
      try {
        const summary = getCapabilitySummary();

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(summary, null, 2),
            },
          ],
        };
      } catch (err) {
        return { content: formatErrorForMcp(err), isError: true };
      }
    }
  );
}
