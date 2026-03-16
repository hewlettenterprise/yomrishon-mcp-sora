import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { OpenAIClient } from "../openai-client.js";
import type { Config } from "../config.js";
import type { Logger } from "../logger.js";
import { CreateCharacterSchema, validateVideoFile } from "../validation.js";
import { formatErrorForMcp, validationError } from "../errors.js";

export function register(
  server: McpServer,
  client: OpenAIClient,
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
        const filePath = params.file_path as string | undefined;
        const fileId = params.file_id as string | undefined;

        if (!filePath && !fileId) {
          throw validationError(
            "Either file_path or file_id is required. Provide a local video file path or " +
              "a previously uploaded file ID."
          );
        }

        let resolvedPath: string | undefined;
        if (filePath) {
          resolvedPath = await validateVideoFile(
            filePath,
            config.allowedUploadDirs
          );
        }

        logger.info("create_character", {
          name: params.name,
          source: filePath ? "file_path" : "file_id",
        });

        const character = await client.createCharacter({
          name: params.name as string,
          file_path: resolvedPath,
          file_id: fileId,
          description: params.description as string | undefined,
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
