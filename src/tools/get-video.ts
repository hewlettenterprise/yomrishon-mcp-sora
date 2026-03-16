import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { OpenAIClient } from "../openai-client.js";
import type { Config } from "../config.js";
import type { Logger } from "../logger.js";
import { GetVideoSchema } from "../validation.js";
import { formatErrorForMcp } from "../errors.js";

export function register(
  server: McpServer,
  client: OpenAIClient,
  _config: Config,
  logger: Logger
): void {
  server.registerTool(
    "sora_get_video",
    {
      description:
        "Retrieve the current status and details of a video generation job by ID. " +
        "Returns the normalized job record including status (queued, in_progress, completed, failed), " +
        "progress percentage if available, error details if failed, and output URL if completed.",
      inputSchema: GetVideoSchema,
    },
    async (params) => {
      try {
        const videoId = params.video_id as string;
        logger.info("get_video", { videoId });

        const job = await client.getVideo(videoId);

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
