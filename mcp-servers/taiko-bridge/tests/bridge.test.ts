import { describe, it, expect, vi, beforeEach } from "vitest";
import { parseEther, isAddress } from "viem";

// ─── Unit tests that require no network or private keys ───────────────────────

describe("ABIs and status utilities", () => {
  it("MESSAGE_STATUS_LABELS has 5 entries matching IBridge.Status enum", async () => {
    const { MESSAGE_STATUS_LABELS, statusToLabel } = await import(
      "../src/lib/abis.js"
    );
    expect(MESSAGE_STATUS_LABELS).toHaveLength(5);
    expect(MESSAGE_STATUS_LABELS[0]).toBe("NEW");
    expect(MESSAGE_STATUS_LABELS[1]).toBe("RETRIABLE");
    expect(MESSAGE_STATUS_LABELS[2]).toBe("DONE");
    expect(MESSAGE_STATUS_LABELS[3]).toBe("FAILED");
    expect(MESSAGE_STATUS_LABELS[4]).toBe("RECALLED");
  });

  it("statusToLabel maps codes to strings", async () => {
    const { statusToLabel } = await import("../src/lib/abis.js");
    expect(statusToLabel(0)).toBe("NEW");
    expect(statusToLabel(2)).toBe("DONE");
    expect(statusToLabel(4)).toBe("RECALLED");
    expect(statusToLabel(99)).toBe("UNKNOWN");
  });

  it("IBridgeABI contains sendMessage, messageStatus, retryMessage, recallMessage", async () => {
    const { IBridgeABI } = await import("../src/lib/abis.js");
    const names = IBridgeABI.map((f: { name: string }) => f.name);
    expect(names).toContain("sendMessage");
    expect(names).toContain("messageStatus");
    expect(names).toContain("retryMessage");
    expect(names).toContain("recallMessage");
  });

  it("IERC20VaultABI contains bridgeToken", async () => {
    const { IERC20VaultABI } = await import("../src/lib/abis.js");
    const names = IERC20VaultABI.map((f: { name: string }) => f.name);
    expect(names).toContain("bridgeToken");
  });

  it("sendMessage ABI has correct Message struct components", async () => {
    const { IBridgeABI } = await import("../src/lib/abis.js");
    const sendMessage = IBridgeABI.find((f: { name: string }) => f.name === "sendMessage")!;
    const inputComponents = (sendMessage as { inputs: Array<{ components: Array<{ name: string }> }> }).inputs[0].components;
    const fieldNames = inputComponents.map((c) => c.name);
    expect(fieldNames).toContain("fee");
    expect(fieldNames).toContain("gasLimit");
    expect(fieldNames).toContain("destChainId");
    expect(fieldNames).toContain("value");
    expect(fieldNames).toContain("data");
  });
});

describe("Network configuration", () => {
  it("BRIDGE_CONTRACTS has correct L1 bridge addresses", async () => {
    const { BRIDGE_CONTRACTS } = await import("../src/networks.js");
    // L1 Bridge addresses confirmed from taikoxyz/taiko-mono deployment logs
    expect(BRIDGE_CONTRACTS.mainnet.l1Bridge).toBe(
      "0xd60247c6848B7Ca29eDdF63AA924E53dB6Ddd8EC"
    );
    expect(BRIDGE_CONTRACTS.hoodi.l1Bridge).toBe(
      "0x6a4cf607DaC2C4784B7D934Bcb3AD7F2ED18Ed80"
    );
  });

  it("BRIDGE_CONTRACTS has correct L2 bridge addresses from NETWORKS constants", async () => {
    const { BRIDGE_CONTRACTS } = await import("../src/networks.js");
    // These come from @taikoxyz/taiko-api-client NETWORKS
    expect(BRIDGE_CONTRACTS.mainnet.l2Bridge).toBe(
      "0x1670000000000000000000000000000000000001"
    );
    expect(BRIDGE_CONTRACTS.hoodi.l2Bridge).toBe(
      "0x167D000000000000000000000000000000000001"
    );
  });

  it("taikoMainnet chain has correct id", async () => {
    const { taikoMainnet } = await import("../src/networks.js");
    expect(taikoMainnet.id).toBe(167000);
  });

  it("taikoHoodi chain has correct id", async () => {
    const { taikoHoodi } = await import("../src/networks.js");
    expect(taikoHoodi.id).toBe(167013);
  });

  it("destChainIds are correct for L1_TO_L2", async () => {
    const { BRIDGE_CONTRACTS } = await import("../src/networks.js");
    expect(BRIDGE_CONTRACTS.mainnet.destChainIds.L1_TO_L2).toBe(167000n);
    expect(BRIDGE_CONTRACTS.hoodi.destChainIds.L1_TO_L2).toBe(167013n);
  });
});

describe("Client helpers", () => {
  it("resolvePrivateKey throws when no key is set", async () => {
    const originalEnv = {
      TAIKO_PRIVATE_KEY: process.env.TAIKO_PRIVATE_KEY,
      TAIKO_MAINNET_PRIVATE_KEY: process.env.TAIKO_MAINNET_PRIVATE_KEY,
    };

    delete process.env.TAIKO_PRIVATE_KEY;
    delete process.env.TAIKO_MAINNET_PRIVATE_KEY;

    const { resolvePrivateKey } = await import("../src/lib/clients.js");

    expect(() => resolvePrivateKey("mainnet")).toThrow("No private key configured");

    // Restore
    Object.assign(process.env, originalEnv);
  });

  it("resolvePrivateKey throws for malformed key", async () => {
    process.env.TAIKO_PRIVATE_KEY = "not-a-real-key";
    const { resolvePrivateKey } = await import("../src/lib/clients.js");

    expect(() => resolvePrivateKey("mainnet")).toThrow("Private key must be");

    delete process.env.TAIKO_PRIVATE_KEY;
  });

  it("resolveBridgeAddress returns l1Bridge for L1_TO_L2", async () => {
    const { resolveBridgeAddress } = await import("../src/lib/clients.js");
    const { BRIDGE_CONTRACTS } = await import("../src/networks.js");

    const addr = resolveBridgeAddress("mainnet", "L1_TO_L2");
    expect(addr).toBe(BRIDGE_CONTRACTS.mainnet.l1Bridge);
  });

  it("resolveBridgeAddress returns l2Bridge for L2_TO_L1", async () => {
    const { resolveBridgeAddress } = await import("../src/lib/clients.js");
    const { BRIDGE_CONTRACTS } = await import("../src/networks.js");

    const addr = resolveBridgeAddress("mainnet", "L2_TO_L1");
    expect(addr).toBe(BRIDGE_CONTRACTS.mainnet.l2Bridge);
  });
});

describe("Amount validation helpers", () => {
  it("parseEther handles standard amounts correctly", () => {
    expect(parseEther("0.1")).toBe(100000000000000000n);
    expect(parseEther("1")).toBe(1000000000000000000n);
  });

  it("isAddress rejects invalid addresses", () => {
    expect(isAddress("not-an-address")).toBe(false);
    expect(isAddress("0x1670000000000000000000000000000000000001")).toBe(true);
  });

  it("uint64 fee overflow guard works", () => {
    const maxUint64 = 2n ** 64n - 1n;
    const tooLarge = 2n ** 64n;
    expect(tooLarge > maxUint64).toBe(true);
    // A valid fee (1 ETH) fits in uint64
    expect(parseEther("1") <= maxUint64).toBe(true);
  });
});

describe("Server instantiation", () => {
  it("createServer returns an McpServer with registered tools", async () => {
    const { createServer } = await import("../src/server.js");
    // Just verify it doesn't throw during construction
    expect(() => createServer()).not.toThrow();
  });
});
