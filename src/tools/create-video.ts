import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { OpenAIClient } from "../openai-client.js";
import type { Config } from "../config.js";
import type { Logger } from "../logger.js";
import { CreateVideoSchema } from "../validation.js";
import {
  validateModel,
  validateSize,
  validateDuration,
  validateCharacterSupport,
  validateImageReferenceSupport,
  normalizeInputReference,
} from "../validation.js";
import { formatErrorForMcp } from "../errors.js";

export function register(
  server: McpServer,
  client: OpenAIClient,
  config: Config,
  logger: Logger
): void {
  server.registerTool(
    "sora_create_video",
    {
      description:
        "Create a new Sora 2 video generation job. Returns immediately with a job record " +
        "(status will be 'queued' or 'in_progress'). Use sora_wait_for_video or sora_get_video " +
        "to track completion. The prompt should describe the scene like a cinematography brief: " +
        "subject, action, setting, camera motion, lighting, and style. " +
        "Use input_reference to guide the opening frame, and characters for cross-shot consistency.",
      inputSchema: CreateVideoSchema,
    },
    async (params) => {
      try {
        const model = (params.model as string) ?? config.defaultModel;
        const size = (params.size as string) ?? "1920x1080";
        const seconds = (params.seconds as number) ?? 10;

        validateModel(model);
        validateSize(model, size);
        validateDuration(model, seconds);

        if (params.input_reference) {
          validateImageReferenceSupport(model);
        }
        if (params.characters && (params.characters as unknown[]).length > 0) {
          validateCharacterSupport(
            model,
            (params.characters as unknown[]).length
          );
        }

        logger.info("create_video", { model, size, seconds });

        // Normalize base64 input references to data URIs before sending
        const inputRef = params.input_reference
          ? normalizeInputReference(
              params.input_reference as {
                type: string;
                url?: string;
                file_id?: string;
                base64?: string;
                media_type?: string;
              }
            )
          : undefined;

        const job = await client.createVideo({
          model,
          prompt: params.prompt as string,
          size,
          seconds,
          input_reference: inputRef,
          characters: params.characters as
            | Array<{ id: string; name: string }>
            | undefined,
          metadata: params.metadata as Record<string, string> | undefined,
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
