// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title HelloTaiko
/// @notice A simple Taiko-aware contract for testing deployments
contract HelloTaiko {
    uint256 public number;

    event NumberSet(uint256 indexed oldNumber, uint256 indexed newNumber);
    event Hello(string network, uint256 chainId);

    /// @notice Emit a greeting with the detected network name
    function hello() external {
        emit Hello(network(), block.chainid);
    }

    /// @notice Return the Taiko network name based on chain ID
    function network() public view returns (string memory) {
        if (block.chainid == 167000) return "Taiko Alethia";
        if (block.chainid == 167013) return "Taiko Hoodi";
        return "Unknown";
    }

    /// @notice Set the counter to a specific number
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
        require(number > 0, "HelloTaiko: cannot decrement below zero");
        number--;
    }
}
