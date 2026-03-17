import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { OpenAIClient } from "../openai-client.js";
import type { Config } from "../config.js";
import type { Logger } from "../logger.js";
import { ExtendVideoSchema } from "../validation.js";
import { formatErrorForMcp, assetError } from "../errors.js";
import { getRequestClient } from "../request-context.js";

export function register(
  server: McpServer,
  defaultClient: OpenAIClient | null,
  config: Config,
  logger: Logger
): void {
  server.registerTool(
    "sora_extend_video",
    {
      description:
        "Extend a completed video by generating additional footage that continues from the " +
        "end of the original clip. The extension uses the full source clip as context for " +
        "visual and narrative continuity. The source video must have status 'completed'. " +
        "This is different from editing — extensions only append new content.",
      inputSchema: ExtendVideoSchema,
    },
    async (params) => {
      try {
        const client = getRequestClient(defaultClient);

        // Pre-check: verify the source video is completed
        const sourceVideo = await client.getVideo(params.video_id as string);
        if (sourceVideo.status !== "completed") {
          throw assetError(
            `Cannot extend video ${params.video_id} — current status is "${sourceVideo.status}". ` +
              `Only completed videos can be extended.`,
            { video_id: params.video_id, status: sourceVideo.status }
          );
        }

        logger.info("extend_video", {
          video_id: params.video_id,
          seconds: params.seconds,
        });

        const job = await client.extendVideo({
          video_id: params.video_id as string,
          prompt: params.prompt as string,
          seconds: params.seconds as number | undefined,
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
