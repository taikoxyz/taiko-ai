import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createServer } from "./server.js";

function parsePort(raw: string | undefined, fallback: number): number {
  const port = Number(raw ?? "");
  if (!Number.isInteger(port) || port <= 0) return fallback;
  return port;
}

function jsonRpcMethodNotAllowed(res: { status: (code: number) => { json: (body: unknown) => void } }): void {
  res.status(405).json({
    jsonrpc: "2.0",
    error: {
      code: -32000,
      message: "Method not allowed.",
    },
    id: null,
  });
}

const host = process.env.MCP_HTTP_HOST ?? "127.0.0.1";
const port = parsePort(process.env.MCP_HTTP_PORT, 3702);
const allowedHosts = (process.env.MCP_ALLOWED_HOSTS ?? "")
  .split(",")
  .map((h) => h.trim())
  .filter(Boolean);

const app = createMcpExpressApp({
  host,
  ...(allowedHosts.length > 0 ? { allowedHosts } : {}),
});

app.get("/health", (_req: unknown, res: { json: (body: unknown) => void }) => {
  res.json({
    ok: true,
    name: "taiko-explorer",
  });
});

app.post("/mcp", async (req: any, res: any) => {
  const server = createServer();
  const transport = new StreamableHTTPServerTransport({
    // Stateless mode: each HTTP request is independent.
    sessionIdGenerator: undefined,
  });

  res.on("close", () => {
    void transport.close();
    void server.close();
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: "Internal server error",
        },
        id: null,
      });
    }
    console.error("taiko-explorer http error:", error);
  }
});

app.get("/mcp", (_req: unknown, res: { status: (code: number) => { json: (body: unknown) => void } }) =>
  jsonRpcMethodNotAllowed(res)
);
app.delete("/mcp", (_req: unknown, res: { status: (code: number) => { json: (body: unknown) => void } }) =>
  jsonRpcMethodNotAllowed(res)
);

app.listen(port, host, () => {
  console.log(`taiko-explorer HTTP MCP listening on http://${host}:${port}/mcp`);
});
