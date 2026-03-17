import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { OpenAIClient } from "../openai-client.js";
import type { Config } from "../config.js";
import type { Logger } from "../logger.js";

import { register as registerCreateVideo } from "./create-video.js";
import { register as registerGetVideo } from "./get-video.js";
import { register as registerListVideos } from "./list-videos.js";
import { register as registerDownloadVideo } from "./download-video.js";
import { register as registerEditVideo } from "./edit-video.js";
import { register as registerExtendVideo } from "./extend-video.js";
import { register as registerCreateCharacter } from "./create-character.js";
import { register as registerGetCharacter } from "./get-character.js";
import { register as registerWaitForVideo } from "./wait-for-video.js";
import { register as registerDescribeCapabilities } from "./describe-capabilities.js";
import { register as registerHelpPrompt } from "./help-prompt.js";

/** Register all MCP tools on the server. */
export function registerAllTools(
  server: McpServer,
  client: OpenAIClient | null,
  config: Config,
  logger: Logger
): void {
  registerCreateVideo(server, client, config, logger);
  registerGetVideo(server, client, config, logger);
  registerListVideos(server, client, config, logger);
  registerDownloadVideo(server, client, config, logger);
  registerEditVideo(server, client, config, logger);
  registerExtendVideo(server, client, config, logger);
  registerCreateCharacter(server, client, config, logger);
  registerGetCharacter(server, client, config, logger);
  registerWaitForVideo(server, client, config, logger);
  registerDescribeCapabilities(server, client, config, logger);
  registerHelpPrompt(server, client, config, logger);

  logger.info("tools_registered", { count: 11 });
}
