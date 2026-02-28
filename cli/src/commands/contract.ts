import { Command } from "commander";
import { spawn } from "child_process";
import { NETWORKS } from "@taikoxyz/taiko-api-client";
import { readConfig, getActiveNetwork } from "../lib/config.js";
import { output, ok, err, type OutputMode } from "../lib/output.js";

export function contractCommand(program: Command): void {
  const contract = program
    .command("contract")
    .description("Smart contract utilities (Taiko-specific verification workflow)");

  // ─── contract verify ────────────────────────────────────────────────────────
  contract
    .command("verify <address> <contract-identifier>")
    .description(
      "Verify a deployed contract on Taikoscan. " +
        "Wraps `forge verify-contract` with Taiko chain ID and API URL auto-configured. " +
        "REQUIRES: Foundry installed (`curl -L https://foundry.paradigm.xyz | bash`). " +
        "TAIKO_ETHERSCAN_API_KEY environment variable required for Taikoscan submission."
    )
    .option("--network <network>", "Override active network (mainnet or hoodi)")
    .option("--compiler-version <version>", "Compiler version (e.g. 0.8.24+commit.e11b9ed9)")
    .option("--optimizer-runs <n>", "Optimizer runs (default: 200)")
    .option("--constructor-args <args>", "ABI-encoded constructor arguments")
    .option("--watch", "Poll Taikoscan until verification result is available")
    .option("--json", "Output as JSON")
    .action(
      async (
        address: string,
        contractIdentifier: string,
        opts: {
          network?: string;
          compilerVersion?: string;
          optimizerRuns?: string;
          constructorArgs?: string;
          watch?: boolean;
          json?: boolean;
        }
      ) => {
        const mode: OutputMode = opts.json ? "json" : "human";
        const config = readConfig();
        const net = (opts.network as "mainnet" | "hoodi" | undefined) ?? getActiveNetwork(config);
        const netConfig = NETWORKS[net];

        const apiKey = process.env.TAIKO_ETHERSCAN_API_KEY ?? process.env.ETHERSCAN_API_KEY;
        if (!apiKey) {
          output(
            err("contract verify", net, [
              "TAIKO_ETHERSCAN_API_KEY (or ETHERSCAN_API_KEY) is required for Taikoscan verification.",
              "Get your API key at https://taikoscan.io/myapikey and set it with:",
              "  export TAIKO_ETHERSCAN_API_KEY=<your-key>",
            ]),
            mode
          );
          process.exit(1);
        }

        const forgeArgs = [
          "verify-contract",
          address,
          contractIdentifier,
          "--chain-id",
          String(netConfig.chainId),
          "--etherscan-api-key",
          apiKey,
          "--verifier-url",
          `${netConfig.taikoscanExplorer}/api`,
        ];

        if (opts.compilerVersion) {
          forgeArgs.push("--compiler-version", opts.compilerVersion);
        }
        if (opts.optimizerRuns) {
          forgeArgs.push("--optimizer-runs", opts.optimizerRuns);
        }
        if (opts.constructorArgs) {
          forgeArgs.push("--constructor-args", opts.constructorArgs);
        }
        if (opts.watch) {
          forgeArgs.push("--watch");
        }

        // Print the command in human mode for transparency
        if (mode === "human") {
          console.log(`Running: forge ${forgeArgs.filter((a) => a !== apiKey).join(" ")} --etherscan-api-key <hidden>`);
        }

        try {
          await runForge(forgeArgs);
          output(
            ok("contract verify", net, {
              address,
              contract: contractIdentifier,
              network: net,
              chain_id: netConfig.chainId,
              explorer: `${netConfig.taikoscanExplorer}/address/${address}#code`,
            }),
            mode
          );
        } catch (e: unknown) {
          output(
            err("contract verify", net, [
              e instanceof Error ? e.message : String(e),
              "Tip: ensure the contract was compiled with the same settings as the on-chain deployment.",
              "If Foundry is not installed: curl -L https://foundry.paradigm.xyz | bash",
            ]),
            mode
          );
          process.exit(1);
        }
      }
    );
}

/** Run `forge <args>` and resolve/reject based on exit code. */
function runForge(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn("forge", args, { stdio: "inherit" });
    proc.on("error", (err) => {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        reject(
          new Error(
            "forge not found. Install Foundry: curl -L https://foundry.paradigm.xyz | bash"
          )
        );
      } else {
        reject(err);
      }
    });
    proc.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`forge verify-contract exited with code ${code}`));
      }
    });
  });
}
