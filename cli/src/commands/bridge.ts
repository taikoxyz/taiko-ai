import { Command } from "commander";
import { RelayerClient } from "@taikoxyz/taiko-api-client";
import { type Network } from "@taikoxyz/taiko-api-client";
import { readConfig, getActiveNetwork } from "../lib/config.js";
import { output, ok, err, type OutputMode } from "../lib/output.js";

export function bridgeCommand(program: Command): void {
  const bridge = program
    .command("bridge")
    .description("Bridge ETH and tokens between L1 and Taiko L2");

  // ─── bridge status ─────────────────────────────────────────────────────────
  bridge
    .command("status <tx-hash>")
    .description("Get the relay status of a bridge transaction by its msg hash or tx hash")
    .option("--json", "Output as JSON")
    .option("--network <network>", "Override active network")
    .action(async (txHash: string, opts: { json?: boolean; network?: string }) => {
      const mode: OutputMode = opts.json ? "json" : "human";
      const config = readConfig();
      const net = (opts.network as "mainnet" | "hoodi" | undefined) ?? getActiveNetwork(config);

      try {
        const relayer = new RelayerClient();
        const event = await relayer.getEventByMsgHash(txHash, net as Network);

        if (!event) {
          output(
            ok("bridge status", net, {
              hash: txHash,
              status: "NOT_FOUND",
              note: "Message not found in relayer. It may not be indexed yet — wait a few minutes and retry.",
            }),
            mode
          );
          return;
        }

        const statusLabels = ["NEW", "RETRIABLE", "DONE", "FAILED", "RECALLED"] as const;
        const statusLabel = statusLabels[event.status] ?? "UNKNOWN";

        output(
          ok("bridge status", net, {
            hash: txHash,
            status: statusLabel,
            event_type: event.eventType,
            src_chain: event.chainID,
            dest_chain: event.destChainID,
            amount: event.amount,
            token_symbol: event.canonicalTokenSymbol,
            created_at: event.createdAt,
            updated_at: event.updatedAt,
            note:
              statusLabel === "NEW" || statusLabel === "RETRIABLE"
                ? "Message pending relay. The relayer will process it automatically."
                : statusLabel === "DONE"
                  ? "Message successfully relayed and claimed."
                  : statusLabel === "FAILED"
                    ? "Message failed. Use `taiko bridge claim` with --retry flag."
                    : undefined,
          }),
          mode
        );
      } catch (e: unknown) {
        output(
          err("bridge status", net, [e instanceof Error ? e.message : String(e)]),
          mode
        );
        process.exit(1);
      }
    });

  // ─── bridge deposit (stub — write ops require TAIKO_PRIVATE_KEY) ───────────
  bridge
    .command("deposit <amount>")
    .description(
      "Bridge ETH from L1 to Taiko L2 (requires TAIKO_PRIVATE_KEY). " +
        "Use the taiko-bridge MCP for full-featured bridge operations."
    )
    .option("--token <address>", "ERC-20 token address (default: ETH)")
    .option("--to <address>", "Recipient address on L2 (default: your address)")
    .option("--fee <wei>", "Relayer processing fee in wei (default: auto)")
    .option("--json", "Output as JSON")
    .option("--network <network>", "Override active network")
    .action((amount: string, opts: { token?: string; to?: string; fee?: string; json?: boolean; network?: string }) => {
      const mode: OutputMode = opts.json ? "json" : "human";
      const config = readConfig();
      const net = (opts.network as "mainnet" | "hoodi" | undefined) ?? getActiveNetwork(config);

      if (!process.env.TAIKO_PRIVATE_KEY) {
        output(
          err("bridge deposit", net, [
            "TAIKO_PRIVATE_KEY environment variable is required for bridge operations.",
            "Set it with: export TAIKO_PRIVATE_KEY=0x<your-private-key>",
          ]),
          mode
        );
        process.exit(1);
      }

      output(
        ok("bridge deposit", net, {
          amount,
          direction: "L1_TO_L2",
          token: opts.token ?? "ETH",
          to: opts.to ?? "(your address)",
          fee: opts.fee ?? "auto",
          note:
            "bridge deposit executes on-chain. Use `taiko-bridge` MCP for AI-assisted bridge operations with simulation and safety checks.",
          status: "not_implemented",
        }),
        mode
      );
    });

  // ─── bridge history ────────────────────────────────────────────────────────
  bridge
    .command("history <address>")
    .description("Get bridge history for an address")
    .option("--json", "Output as JSON")
    .option("--network <network>", "Override active network")
    .option("--page <n>", "Page number (default: 1)")
    .option("--size <n>", "Results per page (default: 20)")
    .action(
      async (
        address: string,
        opts: { json?: boolean; network?: string; page?: string; size?: string }
      ) => {
        const mode: OutputMode = opts.json ? "json" : "human";
        const config = readConfig();
        const net = (opts.network as "mainnet" | "hoodi" | undefined) ?? getActiveNetwork(config);
        const page = parseInt(opts.page ?? "1", 10);
        const size = Math.min(parseInt(opts.size ?? "20", 10), 100);

        try {
          const relayer = new RelayerClient();
          const events = await relayer.getEvents(address, net as Network, page, size);

          output(
            ok("bridge history", net, {
              address,
              page,
              size,
              total: events.total,
              end: events.end,
              items: events.items.map((e) => ({
                id: e.id,
                status: ["NEW", "RETRIABLE", "DONE", "FAILED", "RECALLED"][e.status] ?? "UNKNOWN",
                src_chain: e.chainID,
                dest_chain: e.destChainID,
                amount: e.amount,
                token: e.canonicalTokenSymbol,
                created_at: e.createdAt,
              })),
            }),
            mode
          );
        } catch (e: unknown) {
          output(err("bridge history", net, [e instanceof Error ? e.message : String(e)]), mode);
          process.exit(1);
        }
      }
    );
}
