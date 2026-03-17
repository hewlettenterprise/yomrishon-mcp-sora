import { createServer as createHttpServer } from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { Config } from "./config.js";
import type { ServerContext } from "./server.js";
import { OpenAIClient } from "./openai-client.js";
import { runWithClient } from "./request-context.js";
import { registerAllTools } from "./tools/index.js";

// ---------------------------------------------------------------------------
//  Helpers
// ---------------------------------------------------------------------------

function parseJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf-8")));
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

function extractBearerToken(req: IncomingMessage): string | undefined {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    return header.slice(7).trim();
  }
  return undefined;
}

function jsonError(
  res: ServerResponse,
  status: number,
  code: number,
  message: string
): void {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(
    JSON.stringify({ jsonrpc: "2.0", error: { code, message }, id: null })
  );
}

// ---------------------------------------------------------------------------
//  HTTP server
// ---------------------------------------------------------------------------

export async function startHttpServer(
  ctx: ServerContext,
  config: Config
): Promise<void> {
  const serverInfo = { name: "yomrishon-mcp-sora", version: "1.0.1" };

  const httpServer = createHttpServer(async (req: IncomingMessage, res: ServerResponse) => {
    const pathname = new URL(
      req.url ?? "/",
      `http://${req.headers.host ?? "localhost"}`
    ).pathname;

    // Health check
    if (pathname === "/health" && req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok" }));
      return;
    }

    // MCP endpoint
    if (pathname === "/mcp") {
      try {
        // Create a fresh transport + server per request (stateless mode).
        // MCP SDK v1.27+ requires this for stateless transports.
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: undefined,
        });

        const server = new McpServer(serverInfo);
        registerAllTools(server, ctx.defaultClient, config, ctx.logger);
        await server.connect(transport);

        if (req.method === "POST") {
          const apiKey =
            extractBearerToken(req) ?? config.openaiApiKey;

          if (!apiKey) {
            jsonError(
              res,
              401,
              -32000,
              "Missing API key. Provide an Authorization: Bearer <key> header."
            );
            return;
          }

          const body = await parseJsonBody(req);
          const client = new OpenAIClient(
            { ...config, openaiApiKey: apiKey },
            ctx.logger
          );

          await runWithClient(client, () =>
            transport.handleRequest(req, res, body)
          );
        } else if (req.method === "GET" || req.method === "DELETE") {
          await transport.handleRequest(req, res);
        } else {
          res.writeHead(405, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Method not allowed" }));
        }

        await transport.close();
        await server.close();
      } catch (err) {
        ctx.logger.error("http_request_error", {
          error: err instanceof Error ? err.message : String(err),
        });
        if (!res.headersSent) {
          jsonError(res, 500, -32603, "Internal server error");
        }
      }
      return;
    }

    // Not found
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
  });

  httpServer.listen(config.httpPort, config.httpHost, () => {
    ctx.logger.info("http_server_started", {
      port: config.httpPort,
      host: config.httpHost,
    });
    process.stderr.write(
      `Sora MCP server (HTTP) listening on http://${config.httpHost}:${config.httpPort}/mcp\n`
    );
  });
}
