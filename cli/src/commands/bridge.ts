import { Command } from "commander";
import { RelayerClient, normalizeRelayerPageInfo, statusToString } from "@taikoxyz/taiko-api-client";
import { type Network } from "@taikoxyz/taiko-api-client";
import { readConfig, getActiveNetwork } from "../lib/config.js";
import { output, ok, err, type OutputMode } from "../lib/output.js";

export function bridgeCommand(program: Command): void {
  const bridge = program.command("bridge").description("Bridge ETH and tokens between L1 and Taiko L2");

  // ─── bridge status ─────────────────────────────────────────────────────────
  bridge
    .command("status <tx-hash>")
    .description("Get the relay status of a bridge transaction by its msg hash or tx hash")
    .option("--json", "Output as JSON")
    .option("--network <network>", "Override active network")
    .action(async (txHash: string, opts: { json?: boolean; network?: string }) => {
      const mode: OutputMode = opts.json ? "json" : "human";
      const config = readConfig();
      const rawNet = opts.network;
      if (rawNet !== undefined && rawNet !== "mainnet" && rawNet !== "hoodi") {
        output(err("bridge status", rawNet, [`Unknown network: "${rawNet}". Use mainnet or hoodi.`]), mode);
        process.exit(1);
      }
      const net = (rawNet as "mainnet" | "hoodi" | undefined) ?? getActiveNetwork(config);

      try {
        const relayer = new RelayerClient();
        const details = await relayer.getMessageStatusDetails(txHash, net as Network);

        if (!details) {
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

        const { status, statusCode, event } = details;

        output(
          ok("bridge status", net, {
            hash: txHash,
            status,
            status_code: statusCode,
            event_type: event.eventType,
            src_chain: event.chainID,
            dest_chain: event.destChainID,
            amount: event.amount,
            token_symbol: event.canonicalTokenSymbol,
            created_at: event.createdAt,
            updated_at: event.updatedAt,
            note:
              status === "NEW" || status === "RETRIABLE"
                ? "Message pending relay. The relayer will process it automatically."
                : status === "DONE"
                  ? "Message successfully relayed and claimed."
                  : status === "FAILED"
                    ? "Message failed. Use the taiko-bridge MCP retry_message tool, or manually call IBridge.retryMessage on-chain."
                    : undefined,
          }),
          mode
        );
      } catch (e: unknown) {
        output(err("bridge status", net, [e instanceof Error ? e.message : String(e)]), mode);
        process.exit(1);
      }
    });

  // ─── bridge deposit (stub — write ops require TAIKO_PRIVATE_KEY) ───────────
  bridge
    .command("deposit <amount>")
    .description(
      "Placeholder command. Direct CLI deposit is not implemented yet. " +
        "Use the taiko-bridge MCP for bridge operations."
    )
    .option("--token <address>", "ERC-20 token address (default: ETH)")
    .option("--to <address>", "Recipient address on L2 (default: your address)")
    .option("--fee <wei>", "Relayer processing fee in wei (default: auto)")
    .option("--json", "Output as JSON")
    .option("--network <network>", "Override active network")
    .action((amount: string, opts: { token?: string; to?: string; fee?: string; json?: boolean; network?: string }) => {
      const mode: OutputMode = opts.json ? "json" : "human";
      const config = readConfig();
      const rawNet = opts.network;
      if (rawNet !== undefined && rawNet !== "mainnet" && rawNet !== "hoodi") {
        output(err("bridge deposit", rawNet, [`Unknown network: "${rawNet}". Use mainnet or hoodi.`]), mode);
        process.exit(1);
      }
      const net = (rawNet as "mainnet" | "hoodi" | undefined) ?? getActiveNetwork(config);

      output(
        err("bridge deposit", net, [
          "This command is not implemented yet.",
          "Use the taiko-bridge MCP server (`bridge_eth` / `bridge_erc20`) for production bridge transactions.",
        ]),
        mode
      );
      process.exit(1);
    });

  // ─── bridge history ────────────────────────────────────────────────────────
  bridge
    .command("history <address>")
    .description("Get bridge history for an address")
    .option("--json", "Output as JSON")
    .option("--network <network>", "Override active network")
    .option("--page <n>", "Page number (default: 1)")
    .option("--size <n>", "Results per page (default: 20)")
    .action(async (address: string, opts: { json?: boolean; network?: string; page?: string; size?: string }) => {
      const mode: OutputMode = opts.json ? "json" : "human";
      const config = readConfig();
      const rawNet = opts.network;
      if (rawNet !== undefined && rawNet !== "mainnet" && rawNet !== "hoodi") {
        output(err("bridge history", rawNet, [`Unknown network: "${rawNet}". Use mainnet or hoodi.`]), mode);
        process.exit(1);
      }
      const net = (rawNet as "mainnet" | "hoodi" | undefined) ?? getActiveNetwork(config);
      const page = parseInt(opts.page ?? "1", 10);
      const size = Math.min(parseInt(opts.size ?? "20", 10), 100);

      try {
        const relayer = new RelayerClient();
        const events = await relayer.getEvents(address, net as Network, page, size);
        const pageInfo = normalizeRelayerPageInfo(events);

        output(
          ok("bridge history", net, {
            address,
            page,
            size,
            total: events.total,
            first: pageInfo.first,
            last: pageInfo.last,
            total_pages: pageInfo.totalPages,
            visible: pageInfo.visible,
            items: events.items.map((e) => ({
              id: e.id,
              status: statusToString(e.status),
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
    });
}
