import { Command } from "commander";
import { execSync, spawn } from "child_process";
import { existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { readConfig, getActiveNetwork, getRpcUrl } from "../lib/config.js";
import { output, ok, err, type OutputMode } from "../lib/output.js";
import { jsonRpc, parseHexNumber } from "../lib/rpc.js";

const DEFAULT_COMPOSE_DIR = join(homedir(), "simple-taiko-node");

function getComposeDir(): string {
  return process.env.COMPOSE_DIR ?? DEFAULT_COMPOSE_DIR;
}

function dockerCompose(args: string[], composeDir: string): string {
  if (!existsSync(composeDir)) {
    throw new Error(
      `simple-taiko-node directory not found: ${composeDir}. ` +
        "Clone it from https://github.com/taikoxyz/simple-taiko-node or set COMPOSE_DIR."
    );
  }
  return execSync(`docker compose ${args.join(" ")}`, {
    cwd: composeDir,
    encoding: "utf8",
    stdio: ["inherit", "pipe", "pipe"],
  });
}

export function nodeCommand(program: Command): void {
  const node = program.command("node").description("Manage your Taiko node via Docker Compose");

  // ─── node start ──────────────────────────────────────────────────────────
  node
    .command("start")
    .description("Start the Taiko node (docker compose up -d)")
    .option("--prover", "Enable prover profile")
    .option("--proposer", "Enable proposer profile")
    .option("--json", "Output as JSON")
    .action((opts: { prover?: boolean; proposer?: boolean; json?: boolean }) => {
      const mode: OutputMode = opts.json ? "json" : "human";
      const composeDir = getComposeDir();
      const config = readConfig();
      const net = getActiveNetwork(config);

      try {
        const profiles: string[] = [];
        if (opts.prover) profiles.push("--profile prover");
        if (opts.proposer) profiles.push("--profile proposer");

        dockerCompose([...profiles, "up", "-d"], composeDir);
        output(
          ok("node start", net, {
            compose_dir: composeDir,
            prover_enabled: opts.prover ?? false,
            proposer_enabled: opts.proposer ?? false,
            status: "started",
          }),
          mode
        );
      } catch (e: unknown) {
        output(err("node start", net, [e instanceof Error ? e.message : String(e)]), mode);
        process.exit(1);
      }
    });

  // ─── node stop ───────────────────────────────────────────────────────────
  node
    .command("stop")
    .description("Stop the Taiko node (docker compose down)")
    .option("--json", "Output as JSON")
    .action((opts: { json?: boolean }) => {
      const mode: OutputMode = opts.json ? "json" : "human";
      const composeDir = getComposeDir();
      const config = readConfig();
      const net = getActiveNetwork(config);

      try {
        dockerCompose(["down"], composeDir);
        output(ok("node stop", net, { compose_dir: composeDir, status: "stopped" }), mode);
      } catch (e: unknown) {
        output(err("node stop", net, [e instanceof Error ? e.message : String(e)]), mode);
        process.exit(1);
      }
    });

  // ─── node restart ─────────────────────────────────────────────────────────
  node
    .command("restart")
    .description("Restart the Taiko node (down + up -d)")
    .option("--json", "Output as JSON")
    .action((opts: { json?: boolean }) => {
      const mode: OutputMode = opts.json ? "json" : "human";
      const composeDir = getComposeDir();
      const config = readConfig();
      const net = getActiveNetwork(config);

      try {
        dockerCompose(["down"], composeDir);
        dockerCompose(["up", "-d"], composeDir);
        output(ok("node restart", net, { compose_dir: composeDir, status: "restarted" }), mode);
      } catch (e: unknown) {
        output(err("node restart", net, [e instanceof Error ? e.message : String(e)]), mode);
        process.exit(1);
      }
    });

  // ─── node status ──────────────────────────────────────────────────────────
  node
    .command("status")
    .description("Show node sync status, block height, and peer count")
    .option("--json", "Output as JSON")
    .option("--rpc-url <url>", "Override node RPC URL")
    .action(async (opts: { json?: boolean; rpcUrl?: string }) => {
      const mode: OutputMode = opts.json ? "json" : "human";
      const config = readConfig();
      const net = getActiveNetwork(config);
      const rpcUrl = opts.rpcUrl ?? process.env.TAIKO_RPC ?? getRpcUrl(config, net);

      try {
        const [syncing, peerCountHex, blockNumberHex, headL1Origin] = await Promise.all([
          jsonRpc(rpcUrl, "eth_syncing"),
          jsonRpc(rpcUrl, "net_peerCount"),
          jsonRpc(rpcUrl, "eth_blockNumber"),
          jsonRpc(rpcUrl, "taiko_headL1Origin").catch(() => null),
        ]);

        const isSyncing = syncing !== false;
        const blockNumber = parseHexNumber(blockNumberHex);
        const peerCount = parseHexNumber(peerCountHex);

        let syncInfo: Record<string, unknown> = { synced: !isSyncing };
        if (typeof syncing === "object" && syncing !== null) {
          const s = syncing as { currentBlock?: string; highestBlock?: string };
          const current = parseHexNumber(s.currentBlock);
          const highest = parseHexNumber(s.highestBlock);
          const pct = highest > 0 ? ((current / highest) * 100).toFixed(2) : "0.00";
          syncInfo = {
            synced: false,
            current_block: current,
            highest_block: highest,
            percent: `${pct}%`,
          };
        }

        let l1Origin: number | null = null;
        if (headL1Origin && typeof headL1Origin === "object") {
          const h = headL1Origin as { l1BlockHeight?: string };
          if (h.l1BlockHeight) l1Origin = parseHexNumber(h.l1BlockHeight);
        }

        output(
          ok("node status", net, {
            rpc_url: rpcUrl,
            block_number: blockNumber,
            peer_count: peerCount,
            l1_block_height: l1Origin,
            sync: syncInfo,
          }),
          mode
        );
      } catch (e: unknown) {
        output(
          err("node status", net, [
            e instanceof Error ? e.message : String(e),
            `RPC URL: ${rpcUrl}`,
            "Is your node running? Try: taiko node start",
          ]),
          mode
        );
        process.exit(1);
      }
    });

  // ─── node logs ────────────────────────────────────────────────────────────
  node
    .command("logs")
    .description("Stream node logs (docker compose logs)")
    .option("--follow", "Follow log output")
    .option("--service <name>", "Service name (l2_execution_engine or taiko_client_driver)")
    .option("--tail <n>", "Number of lines to show from the end (default: 100)")
    .option("--json", "Output metadata as JSON (log lines always go to stdout)")
    .action((opts: { follow?: boolean; service?: string; tail?: string; json?: boolean }) => {
      const composeDir = getComposeDir();
      if (!existsSync(composeDir)) {
        console.error(`simple-taiko-node not found: ${composeDir}`);
        process.exit(1);
      }

      const args = ["logs"];
      if (opts.follow) args.push("--follow");
      args.push("--tail", opts.tail ?? "100");
      if (opts.service) args.push(opts.service);

      // Stream logs — pass stdio through
      const child = spawn("docker", ["compose", ...args], {
        cwd: composeDir,
        stdio: "inherit",
      });

      child.on("exit", (code) => {
        process.exit(code ?? 0);
      });
    });

  // ─── node upgrade ─────────────────────────────────────────────────────────
  node
    .command("upgrade")
    .description("Pull latest Docker images and restart (docker compose pull + up -d)")
    .option("--json", "Output as JSON")
    .action((opts: { json?: boolean }) => {
      const mode: OutputMode = opts.json ? "json" : "human";
      const composeDir = getComposeDir();
      const config = readConfig();
      const net = getActiveNetwork(config);

      try {
        dockerCompose(["pull"], composeDir);
        dockerCompose(["up", "-d"], composeDir);
        output(ok("node upgrade", net, { compose_dir: composeDir, status: "upgraded" }), mode);
      } catch (e: unknown) {
        output(err("node upgrade", net, [e instanceof Error ? e.message : String(e)]), mode);
        process.exit(1);
      }
    });
}
