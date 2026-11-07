// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title OliveCoin (OLV)
/// @notice Simulated payment token. The market authority mints it for the demo.
contract OliveCoin is ERC20, Ownable {
    constructor() ERC20("OliveCoin", "OLV") Ownable(msg.sender) {}

    /// @notice Mints OLV. Market authority only.
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
