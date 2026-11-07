// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IBatchRegistry} from "../interfaces/IBatchRegistry.sol";

/// @dev Test-only stand-in for the registry, used by the escrow unit tests.
contract MockBatchRegistry is IBatchRegistry {
    mapping(uint256 => bool) public certified;
    mapping(uint256 => uint256) public lastPrice;
    mapping(uint256 => address) public custodian;

    function setBatch(uint256 id, address who, uint256 price, bool cert) external {
        custodian[id] = who;
        lastPrice[id] = price;
        certified[id] = cert;
    }

    function setCertified(uint256 id, bool cert) external { certified[id] = cert; }
    function setCustodian(uint256 id, address who) external { custodian[id] = who; }

    function isCertified(uint256 id) external view returns (bool) { return certified[id]; }
    function getLastPrice(uint256 id) external view returns (uint256) { return lastPrice[id]; }
    function custodianOf(uint256 id) external view returns (address) { return custodian[id]; }
    function recordSalePrice(uint256 id, uint256 price) external { lastPrice[id] = price; }
}
