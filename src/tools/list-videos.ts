import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { OpenAIClient } from "../openai-client.js";
import type { Config } from "../config.js";
import type { Logger } from "../logger.js";
import { ListVideosSchema } from "../validation.js";
import { formatErrorForMcp } from "../errors.js";
import { getRequestClient } from "../request-context.js";

export function register(
  server: McpServer,
  defaultClient: OpenAIClient | null,
  _config: Config,
  logger: Logger
): void {
  server.registerTool(
    "sora_list_videos",
    {
      description:
        "List recent video generation jobs with optional filters. " +
        "Supports pagination via cursor (pass the last_id from a previous response as 'after'), " +
        "filtering by model name or job status, and configurable result limit (1–100).",
      inputSchema: ListVideosSchema,
    },
    async (params) => {
      try {
        const client = getRequestClient(defaultClient);
        logger.info("list_videos", {
          limit: params.limit,
          order: params.order,
        });

        const result = await client.listVideos({
          limit: params.limit as number | undefined,
          after: params.after as string | undefined,
          order: params.order as "asc" | "desc" | undefined,
        });

        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
        };
      } catch (err) {
        return { content: formatErrorForMcp(err), isError: true };
      }
    }
  );
}
