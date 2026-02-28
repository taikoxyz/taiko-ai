/** Minimal JSON-RPC helper for CLI commands. */

export async function jsonRpc(
  url: string,
  method: string,
  params: unknown[] = []
): Promise<unknown> {
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", method, params, id: 1 }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!resp.ok) throw new Error(`RPC HTTP ${resp.status}: ${resp.statusText}`);
  const data = (await resp.json()) as { result?: unknown; error?: { message: string } };
  if (data.error) throw new Error(`RPC error: ${data.error.message}`);
  return data.result;
}

/** Returns true if the RPC endpoint responds to eth_blockNumber. */
export async function pingRpc(url: string): Promise<boolean> {
  try {
    const result = await jsonRpc(url, "eth_blockNumber");
    return typeof result === "string" && result.startsWith("0x");
  } catch {
    return false;
  }
}

/** Returns true if the URL responds with a 2xx status. */
export async function pingUrl(url: string): Promise<boolean> {
  try {
    const resp = await fetch(url, {
      method: "HEAD",
      signal: AbortSignal.timeout(5_000),
    });
    return resp.ok;
  } catch {
    return false;
  }
}

/** Parse hex number returned by JSON-RPC. */
export function parseHexNumber(hex: unknown): number {
  if (typeof hex !== "string") return 0;
  return parseInt(hex, 16);
}
