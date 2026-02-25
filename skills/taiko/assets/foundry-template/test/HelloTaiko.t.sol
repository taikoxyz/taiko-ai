// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {HelloTaiko} from "../src/HelloTaiko.sol";
import {HoodiAddresses} from "../src/HoodiAddresses.sol";
import {MainnetAddresses} from "../src/MainnetAddresses.sol";

/// @title HelloTaikoTest
/// @notice Tests for HelloTaiko contract
/// @dev Run with: FOUNDRY_PROFILE=layer2 forge test
contract HelloTaikoTest is Test {
    HelloTaiko public hello;

    function setUp() public {
        hello = new HelloTaiko();
    }

    function test_InitialValue() public view {
        assertEq(hello.number(), 0);
    }

    function test_SetNumber() public {
        hello.setNumber(42);
        assertEq(hello.number(), 42);
    }

    function test_Increment() public {
        hello.setNumber(10);
        hello.increment();
        assertEq(hello.number(), 11);
    }

    function test_Decrement() public {
        hello.setNumber(10);
        hello.decrement();
        assertEq(hello.number(), 9);
    }

    function test_RevertWhen_DecrementBelowZero() public {
        hello.setNumber(0);
        vm.expectRevert("HelloTaiko: cannot decrement below zero");
        hello.decrement();
    }

    function testFuzz_SetNumber(uint256 x) public {
        hello.setNumber(x);
        assertEq(hello.number(), x);
    }

    function test_Hello() public {
        hello.hello();
    }
}

/// @title TaikoForkTest
/// @notice Tests that interact with Taiko protocol contracts
/// @dev Run with: FOUNDRY_PROFILE=layer2 forge test --fork-url $TAIKO_RPC
contract TaikoForkTest is Test {
    function _isTaikoFork() internal view returns (bool) {
        return block.chainid == MainnetAddresses.L2_CHAIN_ID
            || block.chainid == HoodiAddresses.L2_CHAIN_ID;
    }

    function _bridgeAddress() internal view returns (address) {
        if (block.chainid == MainnetAddresses.L2_CHAIN_ID) return MainnetAddresses.L2_BRIDGE;
        return HoodiAddresses.L2_BRIDGE;
    }

    function _signalServiceAddress() internal view returns (address) {
        if (block.chainid == MainnetAddresses.L2_CHAIN_ID) return MainnetAddresses.L2_SIGNAL_SERVICE;
        return HoodiAddresses.L2_SIGNAL_SERVICE;
    }

    function test_BridgeExists() public view {
        if (!_isTaikoFork()) return;
        address bridge = _bridgeAddress();
        uint256 codeSize;
        assembly { codeSize := extcodesize(bridge) }
        assertGt(codeSize, 0, "Bridge should have code");
    }

    function test_SignalServiceExists() public view {
        if (!_isTaikoFork()) return;
        address signalService = _signalServiceAddress();
        uint256 codeSize;
        assembly { codeSize := extcodesize(signalService) }
        assertGt(codeSize, 0, "SignalService should have code");
    }

    function test_HelloNetwork() public {
        if (!_isTaikoFork()) return;
        HelloTaiko hello = new HelloTaiko();
        string memory net = hello.network();
        assertTrue(
            keccak256(bytes(net)) == keccak256("Taiko Alethia") ||
            keccak256(bytes(net)) == keccak256("Taiko Hoodi"),
            "Should detect Taiko network"
        );
    }
}
