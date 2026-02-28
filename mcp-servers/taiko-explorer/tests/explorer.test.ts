import { describe, it, expect } from "vitest";

// ─── Opcode scanner tests ───────────────────────────────────────────────────

describe("scanBlockedOpcodes", () => {
  it("returns no issues for empty bytecode", async () => {
    const { scanBlockedOpcodes } = await import("../src/lib/opcodes.js");
    expect(scanBlockedOpcodes("0x")).toHaveLength(0);
    expect(scanBlockedOpcodes("")).toHaveLength(0);
  });

  it("detects TLOAD (0x5C) in bytecode", async () => {
    const { scanBlockedOpcodes } = await import("../src/lib/opcodes.js");
    const issues = scanBlockedOpcodes("0x5c");
    expect(issues).toHaveLength(1);
    expect(issues[0]?.name).toBe("TLOAD");
    expect(issues[0]?.opcode).toBe("0x5c");
  });

  it("detects TSTORE (0x5D) in bytecode", async () => {
    const { scanBlockedOpcodes } = await import("../src/lib/opcodes.js");
    const issues = scanBlockedOpcodes("0x5d");
    expect(issues).toHaveLength(1);
    expect(issues[0]?.name).toBe("TSTORE");
  });

  it("detects MCOPY (0x5E) in bytecode", async () => {
    const { scanBlockedOpcodes } = await import("../src/lib/opcodes.js");
    const issues = scanBlockedOpcodes("0x5e");
    expect(issues).toHaveLength(1);
    expect(issues[0]?.name).toBe("MCOPY");
  });

  it("detects BLOBHASH (0x49) in bytecode", async () => {
    const { scanBlockedOpcodes } = await import("../src/lib/opcodes.js");
    const issues = scanBlockedOpcodes("0x49");
    expect(issues).toHaveLength(1);
    expect(issues[0]?.name).toBe("BLOBHASH");
  });

  it("detects BLOBBASEFEE (0x4A) in bytecode", async () => {
    const { scanBlockedOpcodes } = await import("../src/lib/opcodes.js");
    const issues = scanBlockedOpcodes("0x4a");
    expect(issues).toHaveLength(1);
    expect(issues[0]?.name).toBe("BLOBBASEFEE");
  });

  it("does NOT flag PUSH0 (0x5F) — it IS available in Shanghai", async () => {
    const { scanBlockedOpcodes } = await import("../src/lib/opcodes.js");
    expect(scanBlockedOpcodes("0x5f")).toHaveLength(0);
  });

  it("correctly skips PUSH1 immediate byte — no false positive", async () => {
    const { scanBlockedOpcodes } = await import("../src/lib/opcodes.js");
    // PUSH1 (0x60) followed by 0x5C (which would be TLOAD if not immediate)
    // The 0x5C here is data, not an opcode
    const issues = scanBlockedOpcodes("0x605c");
    expect(issues).toHaveLength(0);
  });

  it("correctly skips PUSH2 immediate bytes", async () => {
    const { scanBlockedOpcodes } = await import("../src/lib/opcodes.js");
    // PUSH2 (0x61) followed by 2 bytes of data: 0x5C 0x5D — both look like blocked opcodes
    const issues = scanBlockedOpcodes("0x61" + "5c5d");
    expect(issues).toHaveLength(0);
  });

  it("correctly skips PUSH32 (0x7F) immediate 32 bytes", async () => {
    const { scanBlockedOpcodes } = await import("../src/lib/opcodes.js");
    // PUSH32 followed by 32 bytes that all look like TLOAD (0x5C)
    const push32Data = "5c".repeat(32);
    const issues = scanBlockedOpcodes("0x7f" + push32Data);
    expect(issues).toHaveLength(0);
  });

  it("detects TLOAD after PUSH1 immediate data ends", async () => {
    const { scanBlockedOpcodes } = await import("../src/lib/opcodes.js");
    // PUSH1 (0x60) 0xAA (data) then TLOAD (0x5C)
    const issues = scanBlockedOpcodes("0x60aa5c");
    expect(issues).toHaveLength(1);
    expect(issues[0]?.name).toBe("TLOAD");
    expect(issues[0]?.offset).toBe(2); // offset 0=PUSH1, 1=data, 2=TLOAD
  });

  it("detects multiple blocked opcodes at correct offsets", async () => {
    const { scanBlockedOpcodes } = await import("../src/lib/opcodes.js");
    // TLOAD (0x5C) at offset 0, TSTORE (0x5D) at offset 1
    const issues = scanBlockedOpcodes("0x5c5d");
    expect(issues).toHaveLength(2);
    expect(issues[0]?.name).toBe("TLOAD");
    expect(issues[0]?.offset).toBe(0);
    expect(issues[1]?.name).toBe("TSTORE");
    expect(issues[1]?.offset).toBe(1);
  });

  it("handles bytecode without 0x prefix", async () => {
    const { scanBlockedOpcodes } = await import("../src/lib/opcodes.js");
    const issues = scanBlockedOpcodes("5c"); // TLOAD without 0x
    expect(issues).toHaveLength(1);
    expect(issues[0]?.name).toBe("TLOAD");
  });

  it("returns no issues for standard Shanghai bytecode (PUSH0, ADD, etc.)", async () => {
    const { scanBlockedOpcodes } = await import("../src/lib/opcodes.js");
    // PUSH0 (0x5F), ADD (0x01), MLOAD (0x51), RETURN (0xF3)
    expect(scanBlockedOpcodes("0x5f0151f3")).toHaveLength(0);
  });
});

// ─── BLOCKED_OPCODES constant ───────────────────────────────────────────────

describe("BLOCKED_OPCODES", () => {
  it("has exactly 5 blocked opcodes", async () => {
    const { BLOCKED_OPCODES } = await import("../src/lib/opcodes.js");
    expect(Object.keys(BLOCKED_OPCODES)).toHaveLength(5);
  });

  it("contains all expected opcode names", async () => {
    const { BLOCKED_OPCODES } = await import("../src/lib/opcodes.js");
    const names = Object.values(BLOCKED_OPCODES);
    expect(names).toContain("TLOAD");
    expect(names).toContain("TSTORE");
    expect(names).toContain("MCOPY");
    expect(names).toContain("BLOBHASH");
    expect(names).toContain("BLOBBASEFEE");
  });

  it("does NOT contain PUSH0 (0x5F) in blocked list", async () => {
    const { BLOCKED_OPCODES } = await import("../src/lib/opcodes.js");
    expect(BLOCKED_OPCODES[0x5f]).toBeUndefined();
  });

  it("Cancun mode has no blocked opcode list", async () => {
    const { getBlockedOpcodes } = await import("../src/lib/opcodes.js");
    expect(Object.keys(getBlockedOpcodes("cancun"))).toHaveLength(0);
    expect(Object.keys(getBlockedOpcodes("pectra"))).toHaveLength(0);
  });

  it("scanBlockedOpcodes can use explicit opcode maps", async () => {
    const { scanBlockedOpcodes, getBlockedOpcodes } = await import("../src/lib/opcodes.js");
    expect(scanBlockedOpcodes("0x5c", getBlockedOpcodes("shanghai"))).toHaveLength(1);
    expect(scanBlockedOpcodes("0x5c", getBlockedOpcodes("cancun"))).toHaveLength(0);
  });
});

// ─── Server instantiation ───────────────────────────────────────────────────

describe("Server instantiation", () => {
  it("createServer returns an McpServer without throwing", async () => {
    const { createServer } = await import("../src/server.js");
    expect(() => createServer()).not.toThrow();
  });
});
