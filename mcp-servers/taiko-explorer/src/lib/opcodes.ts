/**
 * Fork names accepted by TAIKO_EVM_VERSION. "pectra" is kept as an alias for "prague" so
 * existing configurations keep working.
 */
export type TaikoEvmVersion = "shanghai" | "cancun" | "prague" | "pectra" | "osaka";

/** The fork Taiko and Ethereum both run today. */
export const DEFAULT_EVM_VERSION: TaikoEvmVersion = "osaka";

/**
 * Opcodes a chain pinned to the given fork does NOT implement, keyed by the fork the chain is
 * on. Taiko is on Osaka, so its list is empty; the older entries remain for evaluating
 * bytecode against a chain that has not caught up.
 */
const BLOCKED_OPCODES_BY_VERSION: Record<TaikoEvmVersion, Record<number, string>> = {
  shanghai: {
    0x5c: "TLOAD", // EIP-1153 transient storage load (Cancun)
    0x5d: "TSTORE", // EIP-1153 transient storage store (Cancun)
    0x5e: "MCOPY", // EIP-5656 memory copy (Cancun)
    0x49: "BLOBHASH", // EIP-4844 blob hash (Cancun)
    0x4a: "BLOBBASEFEE", // EIP-7516 blob base fee (Cancun)
    0x1e: "CLZ", // EIP-7939 count leading zeros (Osaka)
  },
  cancun: {
    0x1e: "CLZ", // EIP-7939 count leading zeros (Osaka)
  },
  // Prague added no new opcodes over Cancun (EIP-7702 is a transaction type, not an opcode),
  // so its blocked list matches Cancun's.
  prague: {
    0x1e: "CLZ", // EIP-7939 count leading zeros (Osaka)
  },
  pectra: {
    0x1e: "CLZ", // EIP-7939 count leading zeros (Osaka)
  },
  // Osaka is the current fork on both chains — nothing is blocked.
  osaka: {},
};

/**
 * Blocked opcode list for a chain still pinned to Shanghai.
 * Use getBlockedOpcodes(...) for version-aware behavior; Taiko itself is on Osaka.
 */
export const BLOCKED_OPCODES = BLOCKED_OPCODES_BY_VERSION.shanghai;

export function getConfiguredEvmVersion(): TaikoEvmVersion {
  const raw = (process.env.TAIKO_EVM_VERSION ?? DEFAULT_EVM_VERSION).toLowerCase();
  // hasOwnProperty, not `in`: `in` would also accept inherited keys like "constructor".
  if (Object.prototype.hasOwnProperty.call(BLOCKED_OPCODES_BY_VERSION, raw)) {
    return raw as TaikoEvmVersion;
  }
  return DEFAULT_EVM_VERSION;
}

export function getBlockedOpcodes(evmVersion: TaikoEvmVersion = getConfiguredEvmVersion()): Record<number, string> {
  return { ...BLOCKED_OPCODES_BY_VERSION[evmVersion] };
}

export interface OpcodeIssue {
  offset: number;
  opcode: string;
  name: string;
}

/**
 * Returns the number of immediate data bytes following a PUSH opcode.
 * PUSH1 (0x60) pushes 1 byte, PUSH2 (0x61) pushes 2 bytes, ..., PUSH32 (0x7f) pushes 32 bytes.
 * All other opcodes push 0 immediate bytes.
 */
function getImmediateBytes(opcode: number): number {
  if (opcode >= 0x60 && opcode <= 0x7f) return opcode - 0x5f;
  return 0;
}

/**
 * Scan EVM bytecode for opcodes the target chain's fork does not implement.
 * Correctly skips PUSH immediate data to avoid false positives.
 * @param bytecode - Hex string with or without 0x prefix
 */
export function scanBlockedOpcodes(
  bytecode: string,
  blockedOpcodes: Record<number, string> = getBlockedOpcodes()
): OpcodeIssue[] {
  const hex = bytecode.replace(/^0x/i, "");
  if (!hex || hex === "") return [];

  const bytes = Buffer.from(hex, "hex");
  const issues: OpcodeIssue[] = [];
  let i = 0;

  while (i < bytes.length) {
    const op = bytes[i];
    if (op !== undefined && op in blockedOpcodes) {
      issues.push({
        offset: i,
        opcode: `0x${op.toString(16).padStart(2, "0")}`,
        name: blockedOpcodes[op],
      });
    }
    // Skip PUSH immediate data to avoid false positives from data bytes
    i += 1 + getImmediateBytes(op ?? 0);
  }

  return issues;
}
