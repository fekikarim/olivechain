// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/// @notice The only link between the registry (NFT) and the escrow (FT). v1.
interface IBatchRegistry {
    /// @notice True once an inspector certified the batch.
    function isCertified(uint256 batchId) external view returns (bool);

    /// @notice Last declared price in OLV base units (18 decimals).
    function getLastPrice(uint256 batchId) external view returns (uint256);

    /// @notice Current physical holder of the batch.
    function custodianOf(uint256 batchId) external view returns (address);

    /// @notice Records a settled sale price. Only the authorized escrow may call.
    function recordSalePrice(uint256 batchId, uint256 price) external;
}
