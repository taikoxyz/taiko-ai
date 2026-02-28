#!/usr/bin/env node
import { Command } from "commander";
import { networkCommand } from "./commands/network.js";
import { nodeCommand } from "./commands/node.js";
import { bridgeCommand } from "./commands/bridge.js";
import { contractCommand } from "./commands/contract.js";

const program = new Command();

program
  .name("taiko")
  .description(
    "Taiko CLI — network management, node operations, bridge interactions, and contract verification.\n\n" +
      "All commands support --json for AI agent / script compatibility.\n" +
      "Active network is stored in ~/.taiko/config.yaml or set via TAIKO_NETWORK env var."
  )
  .version("0.1.0");

networkCommand(program);
nodeCommand(program);
bridgeCommand(program);
contractCommand(program);

program.parse();
