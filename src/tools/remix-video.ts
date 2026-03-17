import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { OpenAIClient } from "../openai-client.js";
import type { Config } from "../config.js";
import type { Logger } from "../logger.js";
import { RemixVideoSchema } from "../validation.js";
import { formatErrorForMcp } from "../errors.js";
import { getRequestClient } from "../request-context.js";

export function register(
  server: McpServer,
  defaultClient: OpenAIClient | null,
  config: Config,
  logger: Logger
): void {
  server.registerTool(
    "sora_remix_video",
    {
      description:
        "Remix an existing video with a new prompt. Creates a new video " +
        "based on the source video but guided by the updated prompt.",
      inputSchema: RemixVideoSchema,
    },
    async (params) => {
      try {
        const client = getRequestClient(defaultClient);

        logger.info("remix_video", {
          source_video_id: params.source_video_id,
        });

        const job = await client.remixVideo({
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
