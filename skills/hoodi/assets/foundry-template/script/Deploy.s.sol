// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {Counter} from "../src/Counter.sol";
import {TaikoHoodiAddresses} from "../src/TaikoHoodiAddresses.sol";

/// @title DeployCounter
/// @notice Deployment script for Counter contract on Taiko Hoodi
contract DeployCounter is Script {
    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        Counter counter = new Counter();
        console.log("Counter deployed to:", address(counter));

        // Optionally set initial value
        counter.setNumber(0);

        vm.stopBroadcast();
    }
}

/// @title DeployToTaiko
/// @notice Helper script with Taiko-specific configuration and validation
contract DeployToTaiko is Script {
    function run() public {
        // Verify we're on Taiko Hoodi
        require(
            block.chainid == TaikoHoodiAddresses.TAIKO_HOODI_CHAIN_ID,
            "Not on Taiko Hoodi testnet"
        );

        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy your contracts here
        Counter counter = new Counter();
        console.log("Counter deployed to:", address(counter));

        vm.stopBroadcast();

        // Log deployment info
        console.log("Chain ID:", block.chainid);
        console.log("Block number:", block.number);
        console.log("Bridge address:", TaikoHoodiAddresses.L2_BRIDGE);
    }
}
