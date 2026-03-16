import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { OpenAIClient } from "../openai-client.js";
import type { Config } from "../config.js";
import type { Logger } from "../logger.js";
import { WaitForVideoSchema } from "../validation.js";
import { formatErrorForMcp } from "../errors.js";
import { pollUntilComplete } from "../polling.js";

export function register(
  server: McpServer,
  client: OpenAIClient,
  config: Config,
  logger: Logger
): void {
  server.registerTool(
    "sora_wait_for_video",
    {
      description:
        "Poll a video job until it reaches a terminal status (completed or failed) or the " +
        "maximum wait time is exceeded. Returns the final job record. WARNING: this tool may " +
        "take several minutes to return depending on video generation time. Configure " +
        "poll_interval_ms (default 5000) and max_wait_seconds (default 300) as needed. " +
        "If the timeout is reached, use sora_get_video to check status manually later.",
      inputSchema: WaitForVideoSchema,
    },
    async (params) => {
      try {
        const videoId = params.video_id as string;
        const pollIntervalMs =
          (params.poll_interval_ms as number) ?? config.pollIntervalMs;
        const maxWaitSeconds =
          (params.max_wait_seconds as number) ?? config.maxPollSeconds;

        logger.info("wait_for_video", {
          videoId,
          pollIntervalMs,
          maxWaitSeconds,
        });

        const job = await pollUntilComplete(client, logger, {
          videoId,
          pollIntervalMs,
          maxWaitSeconds,
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
