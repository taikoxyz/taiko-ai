import { Command } from "commander";
import { NETWORKS } from "@taikoxyz/taiko-api-client";
import { readConfig, writeConfig, getActiveNetwork, getRpcUrl } from "../lib/config.js";
import { output, ok, err, timed, type OutputMode } from "../lib/output.js";
import { pingRpc, pingUrl, jsonRpc, parseHexNumber } from "../lib/rpc.js";

export function networkCommand(program: Command): void {
  const network = program.command("network").description("Manage Taiko network profiles");

  // ─── network switch ──────────────────────────────────────────────────────
  network
    .command("switch <network>")
    .description("Set the active network profile (mainnet or hoodi)")
    .option("--json", "Output as JSON")
    .action((networkName: string, opts: { json?: boolean }) => {
      const mode: OutputMode = opts.json ? "json" : "human";
      if (networkName !== "mainnet" && networkName !== "hoodi") {
        output(
          err("network switch", networkName, [`Unknown network: "${networkName}". Use mainnet or hoodi.`]),
          mode
        );
        process.exit(1);
      }
      const config = readConfig();
      config.active_network = networkName;
      writeConfig(config);
      output(
        ok("network switch", networkName, { active_network: networkName }),
        mode
      );
    });

  // ─── network status ──────────────────────────────────────────────────────
  network
    .command("status")
    .description("Health check: RPC, explorer, and bridge reachability")
    .option("--json", "Output as JSON")
    .option("--network <network>", "Override active network")
    .action(async (opts: { json?: boolean; network?: string }) => {
      const mode: OutputMode = opts.json ? "json" : "human";
      const config = readConfig();
      const net = (opts.network as "mainnet" | "hoodi" | undefined) ?? getActiveNetwork(config);
      const rpcUrl = getRpcUrl(config, net);
      const netConfig = NETWORKS[net];

      const [data, latency] = await timed(async () => {
        const [rpcOk, explorerOk, relayerOk] = await Promise.all([
          pingRpc(rpcUrl),
          pingUrl(netConfig.taikoscanExplorer),
          pingUrl(netConfig.relayer + "/blockInfo"),
        ]);

        let blockNumber: number | null = null;
        if (rpcOk) {
          try {
            blockNumber = parseHexNumber(await jsonRpc(rpcUrl, "eth_blockNumber"));
          } catch {
            // block number optional
          }
        }

        return {
          network: net,
          chain_id: netConfig.chainId,
          rpc_reachable: rpcOk,
          rpc_url: rpcUrl,
          explorer_reachable: explorerOk,
          relayer_reachable: relayerOk,
          block_number: blockNumber,
        };
      });

      const warnings: string[] = [];
      if (!data.rpc_reachable) warnings.push(`RPC not reachable: ${rpcUrl}`);
      if (!data.explorer_reachable) warnings.push("Taikoscan explorer not reachable");

      output(
        ok("network status", net, data, {
          warnings,
          latency_ms: latency,
        }),
        mode
      );
    });

  // ─── network info ────────────────────────────────────────────────────────
  network
    .command("info")
    .description("Show active network profile: chain ID, contracts, endpoints")
    .option("--json", "Output as JSON")
    .option("--network <network>", "Override active network")
    .action(async (opts: { json?: boolean; network?: string }) => {
      const mode: OutputMode = opts.json ? "json" : "human";
      const config = readConfig();
      const net = (opts.network as "mainnet" | "hoodi" | undefined) ?? getActiveNetwork(config);
      const rpcUrl = getRpcUrl(config, net);
      const netConfig = NETWORKS[net];

      let blockNumber: number | null = null;
      let gasPrice: string | null = null;

      try {
        const [bn, gp] = await Promise.all([
          jsonRpc(rpcUrl, "eth_blockNumber"),
          jsonRpc(rpcUrl, "eth_gasPrice"),
        ]);
        blockNumber = parseHexNumber(bn);
        const gpWei = parseHexNumber(gp);
        gasPrice = `${(gpWei / 1e9).toFixed(4)} Gwei`;
      } catch {
        // Non-fatal
      }

      output(
        ok("network info", net, {
          active_network: net,
          chain_id: netConfig.chainId,
          rpc_url: rpcUrl,
          block_number: blockNumber,
          gas_price: gasPrice,
          explorer: netConfig.taikoscanExplorer,
          relayer: netConfig.relayer,
          contracts: {
            bridge: netConfig.bridge,
            signal_service: netConfig.signalService,
            anchor: netConfig.anchor,
            erc20_vault: netConfig.erc20Vault,
          },
        }),
        mode
      );
    });
}
