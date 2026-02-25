// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {HelloTaiko} from "../src/HelloTaiko.sol";
import {HoodiAddresses} from "../src/HoodiAddresses.sol";
import {MainnetAddresses} from "../src/MainnetAddresses.sol";

/// @title DeployHelloTaiko
/// @notice Basic deployment script for HelloTaiko
contract DeployHelloTaiko is Script {
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        HelloTaiko hello = new HelloTaiko();
        console.log("HelloTaiko deployed to:", address(hello));

        vm.stopBroadcast();
    }
}

/// @title DeployToTaiko
/// @notice Deployment with Taiko-specific validation (auto-detects network)
contract DeployToTaiko is Script {
    function run() public {
        require(
            block.chainid == MainnetAddresses.L2_CHAIN_ID ||
            block.chainid == HoodiAddresses.L2_CHAIN_ID,
            "Not on a Taiko L2 network"
        );

        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        HelloTaiko hello = new HelloTaiko();
        console.log("HelloTaiko deployed to:", address(hello));

        vm.stopBroadcast();

        console.log("Chain ID:", block.chainid);
        console.log("Network:", hello.network());
        console.log("Block number:", block.number);
    }
}
