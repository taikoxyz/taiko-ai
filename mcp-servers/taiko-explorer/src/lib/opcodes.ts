/**
 * Blocked opcodes on Taiko's Shanghai EVM.
 * Taiko runs Shanghai (not Cancun/Prague) until the Gwyneth upgrade.
 * PUSH0 (0x5F) IS available — Shanghai added it.
 *
 * MAINTENANCE: Update this list when Taiko upgrades its EVM version.
 * After Gwyneth (Cancun support), remove TLOAD/TSTORE/MCOPY/BLOBHASH/BLOBBASEFEE.
 * After Pectra support, review for any new opcodes.
 * Track: https://github.com/taikoxyz/taiko-mono for EVM upgrade announcements.
 */
export const BLOCKED_OPCODES: Record<number, string> = {
  0x5c: "TLOAD", // EIP-1153 transient storage load (Cancun)
  0x5d: "TSTORE", // EIP-1153 transient storage store (Cancun)
  0x5e: "MCOPY", // EIP-5656 memory copy (Cancun)
  0x49: "BLOBHASH", // EIP-4844 blob hash (Cancun)
  0x4a: "BLOBBASEFEE", // EIP-7516 blob base fee (Cancun)
};

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
 * Scan EVM bytecode for opcodes not supported on Taiko's Shanghai EVM.
 * Correctly skips PUSH immediate data to avoid false positives.
 * @param bytecode - Hex string with or without 0x prefix
 */
export function scanBlockedOpcodes(bytecode: string): OpcodeIssue[] {
  const hex = bytecode.replace(/^0x/i, "");
  if (!hex || hex === "") return [];

  const bytes = Buffer.from(hex, "hex");
  const issues: OpcodeIssue[] = [];
  let i = 0;

  while (i < bytes.length) {
    const op = bytes[i];
    if (op !== undefined && op in BLOCKED_OPCODES) {
      issues.push({
        offset: i,
        opcode: `0x${op.toString(16).padStart(2, "0")}`,
        name: BLOCKED_OPCODES[op],
      });
    }
    // Skip PUSH immediate data to avoid false positives from data bytes
    i += 1 + getImmediateBytes(op ?? 0);
  }

  return issues;
}
