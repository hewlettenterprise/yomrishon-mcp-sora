import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { OpenAIClient } from "../openai-client.js";
import type { Config } from "../config.js";
import type { Logger } from "../logger.js";
import { EditVideoSchema } from "../validation.js";
import { formatErrorForMcp } from "../errors.js";
import { getRequestClient } from "../request-context.js";

export function register(
  server: McpServer,
  defaultClient: OpenAIClient | null,
  config: Config,
  logger: Logger
): void {
  server.registerTool(
    "sora_edit_video",
    {
      description:
        "Edit an existing video using a new prompt. Takes a source video ID and an editing " +
        "prompt describing the desired changes. Creates a new video job — the original video " +
        "is not modified.",
      inputSchema: EditVideoSchema,
    },
    async (params) => {
      try {
        const client = getRequestClient(defaultClient);

        logger.info("edit_video", {
          source_video_id: params.source_video_id,
        });

        const job = await client.editVideo({
          source_video_id: params.source_video_id as string,
          prompt: params.prompt as string,
        });

        return {
          content: [
            { type: "text" as const, text: JSON.stringify(job, null, 2) },
          ],
        };
      } catch (err) {
        return { content: formatErrorForMcp(err), isError: true };
      }
    }
  );
}
