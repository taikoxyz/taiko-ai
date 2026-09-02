import { describe, it, expect } from "vitest";

// ─── Opcode scanner tests ───────────────────────────────────────────────────

describe("scanBlockedOpcodes", () => {
  it("returns no issues for empty bytecode", async () => {
    const { scanBlockedOpcodes } = await import("../src/lib/opcodes.js");
    expect(scanBlockedOpcodes("0x")).toHaveLength(0);
    expect(scanBlockedOpcodes("")).toHaveLength(0);
  });

  it("detects TLOAD (0x5C) in bytecode", async () => {
    const { scanBlockedOpcodes, getBlockedOpcodes } = await import("../src/lib/opcodes.js");
    const issues = scanBlockedOpcodes("0x5c", getBlockedOpcodes("shanghai"));
    expect(issues).toHaveLength(1);
    expect(issues[0]?.name).toBe("TLOAD");
    expect(issues[0]?.opcode).toBe("0x5c");
  });

  it("detects TSTORE (0x5D) in bytecode", async () => {
    const { scanBlockedOpcodes, getBlockedOpcodes } = await import("../src/lib/opcodes.js");
    const issues = scanBlockedOpcodes("0x5d", getBlockedOpcodes("shanghai"));
    expect(issues).toHaveLength(1);
    expect(issues[0]?.name).toBe("TSTORE");
  });

  it("detects MCOPY (0x5E) in bytecode", async () => {
    const { scanBlockedOpcodes, getBlockedOpcodes } = await import("../src/lib/opcodes.js");
    const issues = scanBlockedOpcodes("0x5e", getBlockedOpcodes("shanghai"));
    expect(issues).toHaveLength(1);
    expect(issues[0]?.name).toBe("MCOPY");
  });

  it("detects BLOBHASH (0x49) in bytecode", async () => {
    const { scanBlockedOpcodes, getBlockedOpcodes } = await import("../src/lib/opcodes.js");
    const issues = scanBlockedOpcodes("0x49", getBlockedOpcodes("shanghai"));
    expect(issues).toHaveLength(1);
    expect(issues[0]?.name).toBe("BLOBHASH");
  });

  it("detects BLOBBASEFEE (0x4A) in bytecode", async () => {
    const { scanBlockedOpcodes, getBlockedOpcodes } = await import("../src/lib/opcodes.js");
    const issues = scanBlockedOpcodes("0x4a", getBlockedOpcodes("shanghai"));
    expect(issues).toHaveLength(1);
    expect(issues[0]?.name).toBe("BLOBBASEFEE");
  });

  it("does NOT flag PUSH0 (0x5F) — it IS available since Shanghai", async () => {
    const { scanBlockedOpcodes, getBlockedOpcodes } = await import("../src/lib/opcodes.js");
    expect(scanBlockedOpcodes("0x5f", getBlockedOpcodes("shanghai"))).toHaveLength(0);
  });

  it("flags nothing by default — Taiko and Ethereum are both on Osaka", async () => {
    const { scanBlockedOpcodes } = await import("../src/lib/opcodes.js");
    // TLOAD, TSTORE, MCOPY, BLOBHASH, BLOBBASEFEE, CLZ all run on Osaka.
    expect(scanBlockedOpcodes("0x5c5d5e494a1e")).toHaveLength(0);
  });

  it("flags CLZ (0x1E) only for chains behind Osaka", async () => {
    const { scanBlockedOpcodes, getBlockedOpcodes } = await import("../src/lib/opcodes.js");
    expect(scanBlockedOpcodes("0x1e", getBlockedOpcodes("prague"))).toHaveLength(1);
    expect(scanBlockedOpcodes("0x1e", getBlockedOpcodes("prague"))[0]?.name).toBe("CLZ");
    expect(scanBlockedOpcodes("0x1e", getBlockedOpcodes("osaka"))).toHaveLength(0);
  });

  it("correctly skips PUSH1 immediate byte — no false positive", async () => {
    const { scanBlockedOpcodes, getBlockedOpcodes } = await import("../src/lib/opcodes.js");
    // PUSH1 (0x60) followed by 0x5C (which would be TLOAD if not immediate)
    // The 0x5C here is data, not an opcode
    const issues = scanBlockedOpcodes("0x605c", getBlockedOpcodes("shanghai"));
    expect(issues).toHaveLength(0);
  });

  it("correctly skips PUSH2 immediate bytes", async () => {
    const { scanBlockedOpcodes, getBlockedOpcodes } = await import("../src/lib/opcodes.js");
    // PUSH2 (0x61) followed by 2 bytes of data: 0x5C 0x5D — both look like blocked opcodes
    const issues = scanBlockedOpcodes("0x61" + "5c5d", getBlockedOpcodes("shanghai"));
    expect(issues).toHaveLength(0);
  });

  it("correctly skips PUSH32 (0x7F) immediate 32 bytes", async () => {
    const { scanBlockedOpcodes, getBlockedOpcodes } = await import("../src/lib/opcodes.js");
    // PUSH32 followed by 32 bytes that all look like TLOAD (0x5C)
    const push32Data = "5c".repeat(32);
    const issues = scanBlockedOpcodes("0x7f" + push32Data, getBlockedOpcodes("shanghai"));
    expect(issues).toHaveLength(0);
  });

  it("detects TLOAD after PUSH1 immediate data ends", async () => {
    const { scanBlockedOpcodes, getBlockedOpcodes } = await import("../src/lib/opcodes.js");
    // PUSH1 (0x60) 0xAA (data) then TLOAD (0x5C)
    const issues = scanBlockedOpcodes("0x60aa5c", getBlockedOpcodes("shanghai"));
    expect(issues).toHaveLength(1);
    expect(issues[0]?.name).toBe("TLOAD");
    expect(issues[0]?.offset).toBe(2); // offset 0=PUSH1, 1=data, 2=TLOAD
  });

  it("detects multiple blocked opcodes at correct offsets", async () => {
    const { scanBlockedOpcodes, getBlockedOpcodes } = await import("../src/lib/opcodes.js");
    // TLOAD (0x5C) at offset 0, TSTORE (0x5D) at offset 1
    const issues = scanBlockedOpcodes("0x5c5d", getBlockedOpcodes("shanghai"));
    expect(issues).toHaveLength(2);
    expect(issues[0]?.name).toBe("TLOAD");
    expect(issues[0]?.offset).toBe(0);
    expect(issues[1]?.name).toBe("TSTORE");
    expect(issues[1]?.offset).toBe(1);
  });

  it("handles bytecode without 0x prefix", async () => {
    const { scanBlockedOpcodes, getBlockedOpcodes } = await import("../src/lib/opcodes.js");
    const issues = scanBlockedOpcodes("5c", getBlockedOpcodes("shanghai")); // TLOAD without 0x
    expect(issues).toHaveLength(1);
    expect(issues[0]?.name).toBe("TLOAD");
  });

  it("returns no issues for plain bytecode (PUSH0, ADD, etc.) on any fork", async () => {
    const { scanBlockedOpcodes, getBlockedOpcodes } = await import("../src/lib/opcodes.js");
    // PUSH0 (0x5F), ADD (0x01), MLOAD (0x51), RETURN (0xF3)
    expect(scanBlockedOpcodes("0x5f0151f3")).toHaveLength(0);
    expect(scanBlockedOpcodes("0x5f0151f3", getBlockedOpcodes("shanghai"))).toHaveLength(0);
  });
});

// ─── BLOCKED_OPCODES constant ───────────────────────────────────────────────

describe("BLOCKED_OPCODES", () => {
  it("has exactly 6 blocked opcodes for a Shanghai-era chain", async () => {
    const { BLOCKED_OPCODES } = await import("../src/lib/opcodes.js");
    expect(Object.keys(BLOCKED_OPCODES)).toHaveLength(6);
  });

  it("contains all expected opcode names", async () => {
    const { BLOCKED_OPCODES } = await import("../src/lib/opcodes.js");
    const names = Object.values(BLOCKED_OPCODES);
    expect(names).toContain("TLOAD");
    expect(names).toContain("TSTORE");
    expect(names).toContain("MCOPY");
    expect(names).toContain("BLOBHASH");
    expect(names).toContain("BLOBBASEFEE");
    expect(names).toContain("CLZ");
  });

  it("does NOT contain PUSH0 (0x5F) in blocked list", async () => {
    const { BLOCKED_OPCODES } = await import("../src/lib/opcodes.js");
    expect(BLOCKED_OPCODES[0x5f]).toBeUndefined();
  });

  it("Osaka mode has no blocked opcode list", async () => {
    const { getBlockedOpcodes } = await import("../src/lib/opcodes.js");
    expect(Object.keys(getBlockedOpcodes("osaka"))).toHaveLength(0);
  });

  it("pre-Osaka forks still block CLZ", async () => {
    const { getBlockedOpcodes } = await import("../src/lib/opcodes.js");
    expect(Object.values(getBlockedOpcodes("cancun"))).toEqual(["CLZ"]);
    expect(Object.values(getBlockedOpcodes("prague"))).toEqual(["CLZ"]);
    expect(Object.values(getBlockedOpcodes("pectra"))).toEqual(["CLZ"]);
  });

  it("defaults to Osaka, and rejects junk TAIKO_EVM_VERSION values", async () => {
    const { getConfiguredEvmVersion, DEFAULT_EVM_VERSION } = await import("../src/lib/opcodes.js");
    const original = process.env.TAIKO_EVM_VERSION;
    try {
      delete process.env.TAIKO_EVM_VERSION;
      expect(getConfiguredEvmVersion()).toBe("osaka");
      expect(DEFAULT_EVM_VERSION).toBe("osaka");

      process.env.TAIKO_EVM_VERSION = "SHANGHAI";
      expect(getConfiguredEvmVersion()).toBe("shanghai");

      // Inherited Object keys must not be accepted as fork names.
      process.env.TAIKO_EVM_VERSION = "constructor";
      expect(getConfiguredEvmVersion()).toBe("osaka");

      process.env.TAIKO_EVM_VERSION = "nonsense";
      expect(getConfiguredEvmVersion()).toBe("osaka");
    } finally {
      if (original === undefined) delete process.env.TAIKO_EVM_VERSION;
      else process.env.TAIKO_EVM_VERSION = original;
    }
  });

  it("scanBlockedOpcodes can use explicit opcode maps", async () => {
    const { scanBlockedOpcodes, getBlockedOpcodes } = await import("../src/lib/opcodes.js");
    expect(scanBlockedOpcodes("0x5c", getBlockedOpcodes("shanghai"))).toHaveLength(1);
    expect(scanBlockedOpcodes("0x5c", getBlockedOpcodes("cancun"))).toHaveLength(0);
    expect(scanBlockedOpcodes("0x5c", getBlockedOpcodes("osaka"))).toHaveLength(0);
  });
});

// ─── Server instantiation ───────────────────────────────────────────────────

describe("Server instantiation", () => {
  it("createServer returns an McpServer without throwing", async () => {
    const { createServer } = await import("../src/server.js");
    expect(() => createServer()).not.toThrow();
  });
});
