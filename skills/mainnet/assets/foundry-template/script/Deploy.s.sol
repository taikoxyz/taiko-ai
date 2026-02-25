// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {Counter} from "../src/Counter.sol";
import {TaikoMainnetAddresses} from "../src/TaikoMainnetAddresses.sol";

/// @title DeployCounter
/// @notice Deployment script for Counter contract on Taiko Alethia mainnet
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
        // Verify we're on Taiko Alethia mainnet
        require(
            block.chainid == TaikoMainnetAddresses.TAIKO_MAINNET_CHAIN_ID,
            "Not on Taiko Alethia mainnet"
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
        console.log("Bridge address:", TaikoMainnetAddresses.L2_BRIDGE);
    }
}
