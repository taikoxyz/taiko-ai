// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {Counter} from "../src/Counter.sol";
import {TaikoMainnetAddresses} from "../src/TaikoMainnetAddresses.sol";

/// @title CounterTest
/// @notice Tests for Counter contract
/// @dev Run with: FOUNDRY_PROFILE=layer2 forge test
///      Fork test: FOUNDRY_PROFILE=layer2 forge test --fork-url https://rpc.mainnet.taiko.xyz
contract CounterTest is Test {
    Counter public counter;

    function setUp() public {
        counter = new Counter();
    }

    function test_InitialValue() public view {
        assertEq(counter.number(), 0);
    }

    function test_SetNumber() public {
        counter.setNumber(42);
        assertEq(counter.number(), 42);
    }

    function test_Increment() public {
        counter.setNumber(10);
        counter.increment();
        assertEq(counter.number(), 11);
    }

    function test_Decrement() public {
        counter.setNumber(10);
        counter.decrement();
        assertEq(counter.number(), 9);
    }

    function test_RevertWhen_DecrementBelowZero() public {
        counter.setNumber(0);
        vm.expectRevert("Counter: cannot decrement below zero");
        counter.decrement();
    }

    function testFuzz_SetNumber(uint256 x) public {
        counter.setNumber(x);
        assertEq(counter.number(), x);
    }
}

/// @title TaikoForkTest
/// @notice Tests that interact with Taiko protocol contracts
/// @dev Run with: FOUNDRY_PROFILE=layer2 forge test --fork-url https://rpc.mainnet.taiko.xyz
contract TaikoForkTest is Test {
    function test_BridgeExists() public view {
        // Skip if not running on fork
        if (block.chainid != TaikoMainnetAddresses.TAIKO_MAINNET_CHAIN_ID) {
            return;
        }

        // Verify bridge contract has code
        address bridge = TaikoMainnetAddresses.L2_BRIDGE;
        uint256 codeSize;
        assembly {
            codeSize := extcodesize(bridge)
        }
        assertGt(codeSize, 0, "Bridge should have code");
    }

    function test_SignalServiceExists() public view {
        // Skip if not running on fork
        if (block.chainid != TaikoMainnetAddresses.TAIKO_MAINNET_CHAIN_ID) {
            return;
        }

        // Verify signal service contract has code
        address signalService = TaikoMainnetAddresses.L2_SIGNAL_SERVICE;
        uint256 codeSize;
        assembly {
            codeSize := extcodesize(signalService)
        }
        assertGt(codeSize, 0, "SignalService should have code");
    }
}
