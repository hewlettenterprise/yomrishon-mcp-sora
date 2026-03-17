import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { OpenAIClient } from "../openai-client.js";
import type { Config } from "../config.js";
import type { Logger } from "../logger.js";
import { DownloadVideoSchema } from "../validation.js";
import { formatErrorForMcp, assetError } from "../errors.js";
import { getRequestClient } from "../request-context.js";
import { createDownloadToken } from "../download-tokens.js";

export function register(
  server: McpServer,
  defaultClient: OpenAIClient | null,
  config: Config,
  logger: Logger
): void {
  server.registerTool(
    "sora_download_video_content",
    {
      description:
        "Get a downloadable URL for a completed video. Returns a proxy download URL that " +
        "can be used directly without any authentication. The URL is single-use and expires " +
        "after 10 minutes — download promptly or call this tool again for a new URL. " +
        "Only works for videos with status 'completed'.",
      inputSchema: DownloadVideoSchema,
    },
    async (params) => {
      try {
        const client = getRequestClient(defaultClient);
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

        // Verify the video content is accessible before issuing a token
        const content = await client.getVideoContent(videoId);

        const token = createDownloadToken(
          videoId,
          client.getApiKey(),
          client.getBaseUrl()
        );
        const downloadUrl = `http://${config.httpHost}:${config.httpPort}/download/${token}`;

        const result = {
          download_url: downloadUrl,
          content_type: content.content_type,
          expires_in_seconds: 600,
        };

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
