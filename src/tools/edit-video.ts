import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { OpenAIClient } from "../openai-client.js";
import type { Config } from "../config.js";
import type { Logger } from "../logger.js";
import { EditVideoSchema } from "../validation.js";
import {
  validateModel,
  validateSize,
  validateDuration,
  validateEditSupport,
  validateCharacterSupport,
} from "../validation.js";
import { formatErrorForMcp } from "../errors.js";

export function register(
  server: McpServer,
  client: OpenAIClient,
  config: Config,
  logger: Logger
): void {
  server.registerTool(
    "sora_edit_video",
    {
      description:
        "Edit an existing video using a new prompt. Takes a source video ID and an editing " +
        "prompt describing the desired changes. Creates a new video job — the original video " +
        "is not modified. Preferred over sora_remix_video for new workflows.",
      inputSchema: EditVideoSchema,
    },
    async (params) => {
      try {
        const model = (params.model as string) ?? config.defaultModel;

        validateModel(model);
        validateEditSupport(model);

        if (params.size) validateSize(model, params.size as string);
        if (params.seconds) validateDuration(model, params.seconds as number);
        if (params.characters && (params.characters as unknown[]).length > 0) {
          validateCharacterSupport(
            model,
            (params.characters as unknown[]).length
          );
        }

        logger.info("edit_video", {
          model,
          source_video_id: params.source_video_id,
        });

        const job = await client.editVideo({
          model,
          source_video_id: params.source_video_id as string,
          prompt: params.prompt as string,
          size: params.size as string | undefined,
          seconds: params.seconds as number | undefined,
          characters: params.characters as
            | Array<{ id: string; name: string }>
            | undefined,
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
