import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { OpenAIClient } from "../openai-client.js";
import type { Config } from "../config.js";
import type { Logger } from "../logger.js";
import { CreateCharacterSchema, validateVideoFile } from "../validation.js";
import { formatErrorForMcp, validationError } from "../errors.js";
import { getRequestClient } from "../request-context.js";

export function register(
  server: McpServer,
  defaultClient: OpenAIClient | null,
  config: Config,
  logger: Logger
): void {
  server.registerTool(
    "sora_create_character",
    {
      description:
        "Upload a character asset from a short video clip for reuse across multiple generations. " +
        "Characters ensure visual consistency of a person, animal, or entity across different shots. " +
        "Provide either a local file_path (must be in an allowed upload directory) or a previously " +
        "uploaded file_id. After creation, reference the character by its ID in sora_create_video or " +
        "sora_edit_video, and always mention the character by name in your prompt for best results.",
      inputSchema: CreateCharacterSchema,
    },
    async (params) => {
      try {
        const client = getRequestClient(defaultClient);
        const filePath = params.file_path as string | undefined;

        if (!filePath) {
          throw validationError(
            "file_path is required. The OpenAI Characters API requires a direct video " +
              "file upload to POST /videos/characters."
          );
        }

        const resolvedPath = await validateVideoFile(
          filePath,
          config.allowedUploadDirs
        );

        logger.info("create_character", {
          name: params.name,
        });

        const character = await client.createCharacter({
          name: params.name as string,
          file_path: resolvedPath,
        });

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(character, null, 2),
            },
          ],
        };
      } catch (err) {
        return { content: formatErrorForMcp(err), isError: true };
      }
    }
  );
}
