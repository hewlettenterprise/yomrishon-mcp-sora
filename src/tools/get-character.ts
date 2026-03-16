import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { OpenAIClient } from "../openai-client.js";
import type { Config } from "../config.js";
import type { Logger } from "../logger.js";
import { GetCharacterSchema } from "../validation.js";
import { formatErrorForMcp } from "../errors.js";

export function register(
  server: McpServer,
  client: OpenAIClient,
  _config: Config,
  logger: Logger
): void {
  server.registerTool(
    "sora_get_character",
    {
      description:
        "Retrieve metadata for a previously created character asset, including its ID, name, " +
        "description, creation time, and associated file ID.",
      inputSchema: GetCharacterSchema,
    },
    async (params) => {
      try {
        const characterId = params.character_id as string;
        logger.info("get_character", { characterId });

        const character = await client.getCharacter(characterId);

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
