/**
 * Functional tests for taiko-data MCP tools
 * These tests make real RPC/API calls to validate tool functionality
 *
 * Run with: TAIKOSCAN_API_KEY=<key> vitest run tests/functional.test.ts
 * Without API key: some taikoscan tests are skipped
 */

import { describe, it, expect } from "vitest";
import { ethers } from "ethers";
import { TaikoscanClient, BlockscoutClient, RelayerClient } from "@taikoxyz/taiko-api-client";
import { getProvider, getHeadL1Origin } from "../src/lib/rpc.js";

const GOLDEN_TOUCH = "0x0000777735367b36bC9B61C50022d9D0700dB4Ec";
const ANCHOR = "0x1670000000000000000000000000000000010001";
const BRIDGE = "0x1670000000000000000000000000000000000001";

const hasApiKey = !!process.env.TAIKOSCAN_API_KEY;

describe("RPC tools (no API key needed)", () => {
  it("get_block_number returns current Taiko block", async () => {
    const provider = getProvider("mainnet");
    const blockNumber = await provider.getBlockNumber();
    expect(blockNumber).toBeGreaterThan(4_000_000); // Taiko has > 4M blocks
  }, 15_000);

  it("get_block_info returns valid block with chain 167000", async () => {
    const provider = getProvider("mainnet");
    const block = await provider.getBlock("latest");
    expect(block).not.toBeNull();
    expect(block!.number).toBeGreaterThan(0);
    expect(block!.hash).toMatch(/^0x[0-9a-f]{64}$/);
    expect(block!.timestamp).toBeGreaterThan(1_700_000_000);
    // gasLimit should be around 240M
    expect(block!.gasLimit).toBeGreaterThan(200_000_000n);
  }, 15_000);

  it("get_balance returns non-zero for GOLDEN_TOUCH_ADDRESS", async () => {
    const provider = getProvider("mainnet");
    const balance = await provider.getBalance(GOLDEN_TOUCH);
    expect(balance).toBeGreaterThan(0n);
  }, 15_000);

  it("get_anchor_block_state: taiko_headL1Origin returns valid L1 data", async () => {
    const l1Origin = await getHeadL1Origin("mainnet");
    const blockId = parseInt(l1Origin.blockID, 16);
    const l1Height = parseInt(l1Origin.l1BlockHeight, 16);
    expect(blockId).toBeGreaterThan(4_000_000);
    expect(l1Height).toBeGreaterThan(20_000_000); // Ethereum L1 > 20M blocks
    expect(l1Origin.l1BlockHash).toMatch(/^0x[0-9a-f]{64}$/);
    expect(l1Origin.l2BlockHash).toMatch(/^0x[0-9a-f]{64}$/);
  }, 15_000);

  it("get_transaction_count works for known address", async () => {
    const provider = getProvider("mainnet");
    const count = await provider.getTransactionCount(GOLDEN_TOUCH);
    expect(count).toBeGreaterThan(0);
  }, 15_000);
});

describe("Blockscout tools (no API key needed)", () => {
  it("search returns results for TAIKO token", async () => {
    const blockscout = new BlockscoutClient();
    const results = await blockscout.search("TAIKO", "mainnet");
    expect(results.items.length).toBeGreaterThan(0);
    const taikoToken = results.items.find((i) => i.symbol === "TAIKO" && i.type === "token");
    expect(taikoToken).toBeDefined();
  }, 15_000);

  it("search by address returns contract info", async () => {
    const blockscout = new BlockscoutClient();
    const results = await blockscout.search(ANCHOR, "mainnet");
    expect(results.items.length).toBeGreaterThan(0);
    const found = results.items.find((i) => i.address?.toLowerCase() === ANCHOR.toLowerCase());
    expect(found).toBeDefined();
  }, 15_000);
});

describe("Taikoscan tools (Etherscan V2 API key required)", () => {
  it.skipIf(!hasApiKey)(
    "get_balance via Etherscan V2 returns balance for GOLDEN_TOUCH",
    async () => {
      const taikoscan = new TaikoscanClient(process.env.TAIKOSCAN_API_KEY);
      const balance = await taikoscan.getBalance(GOLDEN_TOUCH, "mainnet");
      const eth = ethers.formatEther(balance);
      expect(parseFloat(eth)).toBeGreaterThan(0);
    },
    15_000
  );

  it.skipIf(!hasApiKey)(
    "get_contract_abi returns ABI for TaikoAnchor",
    async () => {
      const taikoscan = new TaikoscanClient(process.env.TAIKOSCAN_API_KEY);
      const abi = await taikoscan.getContractABI(ANCHOR, "mainnet");
      const parsed = JSON.parse(abi);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBeGreaterThan(0);
    },
    15_000
  );

  it.skipIf(!hasApiKey)(
    "get_gas_price: gastracker returns null (not supported on Taiko), RPC fee data works",
    async () => {
      const taikoscan = new TaikoscanClient(process.env.TAIKOSCAN_API_KEY);
      // gastracker module is not available on Taiko — should return null gracefully
      const oracle = await taikoscan.getGasOracle("mainnet");
      expect(oracle).toBeNull();
      // Verify RPC-based fee data works as fallback
      const provider = getProvider("mainnet");
      const feeData = await provider.getFeeData();
      expect(feeData.gasPrice).not.toBeNull();
      expect(feeData.gasPrice!).toBeGreaterThan(0n);
    },
    15_000
  );
});

describe("Relayer API (relayer.mainnet.taiko.xyz)", () => {
  it("blockInfo returns L1 and L2 chain data", async () => {
    const relayer = new RelayerClient();
    const info = await relayer.getBlockInfo("mainnet");
    expect(info.data).toBeDefined();
    const l2Entry = info.data.find((d) => d.chainID === 167000);
    expect(l2Entry).toBeDefined();
    expect(l2Entry!.latestBlock).toBeGreaterThan(4_000_000);
  }, 15_000);

  it("getEvents returns response for any address", async () => {
    const relayer = new RelayerClient();
    const response = await relayer.getEvents(GOLDEN_TOUCH, "mainnet");
    expect(response).toHaveProperty("total");
    expect(response).toHaveProperty("items");
  }, 15_000);
});

describe("Bridge message status (on-chain fallback)", () => {
  it("IBridge.messageStatus returns numeric status for valid hash", async () => {
    const provider = getProvider("mainnet");
    const BRIDGE_ABI = ["function messageStatus(bytes32 msgHash) view returns (uint8)"];
    const bridge = new ethers.Contract(BRIDGE, BRIDGE_ABI, provider);
    // Use a dummy hash — expect status 0 (NEW, meaning "not found")
    const dummyHash = "0x" + "0".repeat(64);
    const status = await bridge.messageStatus(dummyHash);
    expect(Number(status)).toBe(0); // NEW for unknown messages
  }, 15_000);
});
