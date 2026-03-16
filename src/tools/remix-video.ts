import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { OpenAIClient } from "../openai-client.js";
import type { Config } from "../config.js";
import type { Logger } from "../logger.js";
import { RemixVideoSchema } from "../validation.js";
import {
  validateModel,
  validateSize,
  validateDuration,
  validateRemixSupport,
} from "../validation.js";
import { formatErrorForMcp } from "../errors.js";

export function register(
  server: McpServer,
  client: OpenAIClient,
  config: Config,
  logger: Logger
): void {
  server.registerTool(
    "sora_remix_video",
    {
      description:
        "[DEPRECATED — prefer sora_edit_video] Remix an existing video with a new prompt. " +
        "This tool is provided for backward compatibility only. Not all models support remix. " +
        "Use sora_edit_video for new workflows, which provides the same functionality with " +
        "better model support.",
      inputSchema: RemixVideoSchema,
    },
    async (params) => {
      try {
        const model = (params.model as string) ?? config.defaultModel;

        validateModel(model);
        validateRemixSupport(model);

        if (params.size) validateSize(model, params.size as string);
        if (params.seconds) validateDuration(model, params.seconds as number);

        logger.warn("remix_video_deprecated", {
          model,
          source_video_id: params.source_video_id,
        });

        const job = await client.remixVideo({
          model,
          source_video_id: params.source_video_id as string,
          prompt: params.prompt as string,
          size: params.size as string | undefined,
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
