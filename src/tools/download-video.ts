import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { OpenAIClient } from "../openai-client.js";
import type { Config } from "../config.js";
import type { Logger } from "../logger.js";
import { DownloadVideoSchema } from "../validation.js";
import { formatErrorForMcp, assetError } from "../errors.js";

export function register(
  server: McpServer,
  client: OpenAIClient,
  _config: Config,
  logger: Logger
): void {
  server.registerTool(
    "sora_download_video_content",
    {
      description:
        "Get a downloadable content URL for a completed video. Returns a signed URL with " +
        "content type and expiration timestamp. The URL is temporary — download promptly or " +
        "call this tool again when the URL expires. Only works for videos with status 'completed'. " +
        "Check the expires_at field to know when the URL will become invalid.",
      inputSchema: DownloadVideoSchema,
    },
    async (params) => {
      try {
        const videoId = params.video_id as string;
        logger.info("download_video_content", { videoId });

        // Pre-check: verify the video is completed before requesting content
        const job = await client.getVideo(videoId);
        if (job.status !== "completed") {
          throw assetError(
            `Video ${videoId} is not completed (current status: ${job.status}). ` +
              `Only completed videos have downloadable content. ` +
              `Use sora_wait_for_video to wait for completion.`,
            { videoId, status: job.status }
          );
        }

        const content = await client.getVideoContent(videoId);

        return {
          content: [
            { type: "text" as const, text: JSON.stringify(content, null, 2) },
          ],
        };
      } catch (err) {
        return { content: formatErrorForMcp(err), isError: true };
      }
    }
  );
}
