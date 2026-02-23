// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title Counter
/// @notice A simple counter contract for testing deployments on Taiko
contract Counter {
    uint256 public number;

    event NumberSet(uint256 indexed oldNumber, uint256 indexed newNumber);

    /// @notice Set the counter to a specific number
    /// @param newNumber The new value for the counter
    function setNumber(uint256 newNumber) public {
        uint256 oldNumber = number;
        number = newNumber;
        emit NumberSet(oldNumber, newNumber);
    }

    /// @notice Increment the counter by 1
    function increment() public {
        number++;
    }

    /// @notice Decrement the counter by 1
    function decrement() public {
        require(number > 0, "Counter: cannot decrement below zero");
        number--;
    }
}
