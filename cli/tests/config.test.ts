import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { readConfig, writeConfig, getActiveNetwork, getRpcUrl } from "../src/lib/config.js";

// ─── helpers ────────────────────────────────────────────────────────────────

let tmpDir: string;
let configPath: string;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "taiko-cli-test-"));
  configPath = join(tmpDir, "config.yaml");
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
  delete process.env.TAIKO_NETWORK;
  delete process.env.TAIKO_RPC_URL;
});

// ─── readConfig ─────────────────────────────────────────────────────────────

describe("readConfig()", () => {
  it("returns default config when no file exists", () => {
    const config = readConfig(configPath);
    expect(config.active_network).toBe("mainnet");
    expect(config.networks.mainnet.rpc_url).toContain("taiko.xyz");
    expect(config.networks.hoodi.rpc_url).toContain("hoodi");
  });

  it("reads back a written config correctly", () => {
    const original = readConfig(configPath);
    original.active_network = "hoodi";
    writeConfig(original, configPath);

    const loaded = readConfig(configPath);
    expect(loaded.active_network).toBe("hoodi");
  });

  it("returns defaults when config file is invalid YAML", () => {
    writeFileSync(configPath, "not: valid: yaml: [[[", "utf8");
    const config = readConfig(configPath);
    expect(config.active_network).toBe("mainnet");
  });
});

// ─── writeConfig ────────────────────────────────────────────────────────────

describe("writeConfig()", () => {
  it("persists active_network changes", () => {
    const config = readConfig(configPath);
    config.active_network = "hoodi";
    writeConfig(config, configPath);

    const reloaded = readConfig(configPath);
    expect(reloaded.active_network).toBe("hoodi");
  });

  it("persists custom rpc_url changes", () => {
    const config = readConfig(configPath);
    config.networks.mainnet.rpc_url = "https://my-custom-rpc.example.com";
    writeConfig(config, configPath);

    const reloaded = readConfig(configPath);
    expect(reloaded.networks.mainnet.rpc_url).toBe("https://my-custom-rpc.example.com");
  });

  it("creates parent directories if they do not exist", () => {
    const deepPath = join(tmpDir, "nested", "dir", "config.yaml");
    const config = readConfig(configPath);
    expect(() => writeConfig(config, deepPath)).not.toThrow();
    const reloaded = readConfig(deepPath);
    expect(reloaded.active_network).toBe("mainnet");
  });
});

// ─── getActiveNetwork ────────────────────────────────────────────────────────

describe("getActiveNetwork()", () => {
  it("returns active_network from config when no env var is set", () => {
    const config = readConfig(configPath);
    config.active_network = "hoodi";
    expect(getActiveNetwork(config)).toBe("hoodi");
  });

  it("TAIKO_NETWORK env var overrides config", () => {
    const config = readConfig(configPath);
    config.active_network = "mainnet";
    process.env.TAIKO_NETWORK = "hoodi";
    expect(getActiveNetwork(config)).toBe("hoodi");
  });

  it("ignores invalid TAIKO_NETWORK values and falls back to config", () => {
    const config = readConfig(configPath);
    config.active_network = "mainnet";
    process.env.TAIKO_NETWORK = "unsupported-network";
    expect(getActiveNetwork(config)).toBe("mainnet");
  });
});

// ─── getRpcUrl ───────────────────────────────────────────────────────────────

describe("getRpcUrl()", () => {
  it("returns config rpc_url when no env override", () => {
    const config = readConfig(configPath);
    const url = getRpcUrl(config, "mainnet");
    expect(url).toContain("taiko.xyz");
  });

  it("TAIKO_RPC_URL env var overrides config", () => {
    const config = readConfig(configPath);
    process.env.TAIKO_RPC_URL = "https://my-rpc.example.com";
    expect(getRpcUrl(config, "mainnet")).toBe("https://my-rpc.example.com");
  });

  it("returns hoodi rpc for hoodi network", () => {
    const config = readConfig(configPath);
    const url = getRpcUrl(config, "hoodi");
    expect(url).toContain("hoodi");
  });
});
