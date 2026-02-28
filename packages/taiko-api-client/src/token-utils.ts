/**
 * Token-efficiency utilities for MCP tool responses.
 *
 * These helpers reduce the payload size of tool outputs that are consumed
 * by LLMs, keeping context-window usage low without losing useful information.
 */

// ── ABI summarisation ─────────────────────────────────────────────────────────

export interface AbiEntry {
  type: string;
  name?: string;
  inputs?: Array<{ name: string; type: string }>;
  outputs?: Array<{ name: string; type: string }>;
  stateMutability?: string;
  anonymous?: boolean;
}

export interface AbiSummary {
  type: string;
  name: string;
  signature: string;
  stateMutability?: string;
  inputs?: Array<{ name: string; type: string }>;
  outputs?: Array<{ name: string; type: string }>;
}

/**
 * Collapse a full JSON ABI into a compact summary.
 *
 * Keeps function/event name, canonical signature, input/output types,
 * and mutability.  Drops everything else (full JSON nesting, internal
 * type metadata, component structs, etc.).
 *
 * Typical reduction: 90%+ for complex contracts.
 */
export function summarizeAbi(abi: unknown): AbiSummary[] {
  if (!Array.isArray(abi)) return [];

  const entries = abi as AbiEntry[];
  const out: AbiSummary[] = [];

  for (const entry of entries) {
    if (!entry.name) continue;
    if (entry.type !== "function" && entry.type !== "event") continue;

    const inputTypes = (entry.inputs ?? []).map((i) => i.type).join(",");
    const signature = `${entry.name}(${inputTypes})`;

    const summary: AbiSummary = {
      type: entry.type,
      name: entry.name,
      signature,
    };

    if (entry.stateMutability) summary.stateMutability = entry.stateMutability;

    if (entry.inputs && entry.inputs.length > 0) {
      summary.inputs = entry.inputs.map((i) => ({ name: i.name, type: i.type }));
    }

    if (entry.type === "function" && entry.outputs && entry.outputs.length > 0) {
      summary.outputs = entry.outputs.map((o) => ({ name: o.name, type: o.type }));
    }

    out.push(summary);
  }

  return out;
}

// ── Hex truncation ────────────────────────────────────────────────────────────

/**
 * Truncate a hex string to at most `maxBytes` worth of data.
 *
 * If the value is within the limit it is returned as-is.
 * Otherwise the first `maxBytes` bytes are kept and a trailing note is
 * appended so the LLM knows data was elided.
 *
 * @param hex       Hex string, with or without 0x prefix
 * @param maxBytes  Maximum number of bytes to keep (default 256 → 512 hex chars)
 */
export function truncateHex(hex: string, maxBytes = 256): string {
  if (!hex || hex === "0x") return hex;

  const prefix = hex.startsWith("0x") ? "0x" : "";
  const raw = hex.startsWith("0x") ? hex.slice(2) : hex;
  const totalBytes = Math.ceil(raw.length / 2);

  if (totalBytes <= maxBytes) return hex;

  const kept = raw.slice(0, maxBytes * 2);
  return `${prefix}${kept}...(truncated, ${totalBytes} bytes total)`;
}

// ── Transaction field stripping ───────────────────────────────────────────────

/** Fields that rarely matter for LLM analysis. */
const LOW_VALUE_TX_FIELDS = new Set(["blockHash", "cumulativeGasUsed", "confirmations", "transactionIndex"]);

/**
 * Strip low-value fields and truncate `input` on a raw Etherscan-style
 * transaction object.  Returns a new object (does not mutate the original).
 */
export function compactTransaction(tx: Record<string, unknown>, inputMaxBytes = 256): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(tx)) {
    if (LOW_VALUE_TX_FIELDS.has(k)) continue;
    if (k === "input" && typeof v === "string") {
      out[k] = truncateHex(v, inputMaxBytes);
    } else {
      out[k] = v;
    }
  }
  return out;
}
