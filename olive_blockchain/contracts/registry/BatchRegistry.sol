// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IBatchRegistry} from "../interfaces/IBatchRegistry.sol";

/// @title BatchRegistry
/// @notice One ERC-721 per olive oil batch. Custody == NFT ownership. Holds no money.
contract BatchRegistry is ERC721URIStorage, Ownable, IBatchRegistry {
    struct Batch {
        uint128 lastPrice; // OLV base units
        bool certified;
    }

    uint256 private _nextId = 1;
    address public escrow;
    mapping(uint256 => Batch) private _batches;
    mapping(address => bool) public isInspector;

    event BatchMinted(uint256 indexed batchId, address indexed farmer, address indexed custodian, string metadataURI);
    event CustodyTransferred(uint256 indexed batchId, address indexed from, address indexed to);
    event CheckpointAdded(uint256 indexed batchId, bytes32 dataHash, address indexed inspector);
    event BatchCertified(uint256 indexed batchId, address indexed inspector);
    event PriceRecorded(uint256 indexed batchId, uint256 price);
    event InspectorSet(address indexed inspector, bool allowed);
    event EscrowSet(address indexed escrow);

    error ZeroAddress();
    error ZeroPrice();
    error PriceTooHigh();
    error NotInspector();
    error NotEscrow();
    error NotCustodian();
    error AlreadyCertified();
    error NonexistentBatch();

    modifier onlyInspector() {
        if (!isInspector[msg.sender]) revert NotInspector();
        _;
    }

    constructor() ERC721("OliveChain Batch", "OLB") Ownable(msg.sender) {}

    // ---------------------------------------------------------------- regulator

    /// @notice Grants or revokes the inspector role.
    function setInspector(address inspector, bool allowed) external onlyOwner {
        if (inspector == address(0)) revert ZeroAddress();
        isInspector[inspector] = allowed;
        emit InspectorSet(inspector, allowed);
    }

    /// @notice Sets the only address allowed to call `recordSalePrice`.
    function setEscrow(address newEscrow) external onlyOwner {
        if (newEscrow == address(0)) revert ZeroAddress();
        escrow = newEscrow;
        emit EscrowSet(newEscrow);
    }

    // ------------------------------------------------------------------- farmer

    /// @notice Registers a new olive oil batch.
    /// @param to first custodian
    /// @param metadataURI off-chain description (variety, farm, harvest, litres)
    /// @param initialPrice declared price in OLV base units
    function mintBatch(address to, string calldata metadataURI, uint256 initialPrice)
        external
        returns (uint256 batchId)
    {
        if (initialPrice == 0) revert ZeroPrice();
        if (initialPrice > type(uint128).max) revert PriceTooHigh();
        unchecked {
            batchId = _nextId++; // cannot overflow in practice
        }
        _batches[batchId].lastPrice = uint128(initialPrice);
        _mint(to, batchId); // reverts on zero address
        _setTokenURI(batchId, metadataURI);
        emit BatchMinted(batchId, msg.sender, to, metadataURI);
        emit PriceRecorded(batchId, initialPrice);
    }

    // ---------------------------------------------------------------- custodian

    /// @notice Hands the physical batch to the next actor of the chain.
    function transferCustody(uint256 batchId, address newCustodian) external {
        address current = _requireOwned(batchId);
        if (current != msg.sender) revert ERC721IncorrectOwner(msg.sender, batchId, current);
        _transfer(msg.sender, newCustodian, batchId);
    }

    // ---------------------------------------------------------------- inspector

    /// @notice Records a quality measurement as a hash of the off-chain record.
    function addCheckpoint(uint256 batchId, bytes32 dataHash) external onlyInspector {
        _requireOwned(batchId);
        emit CheckpointAdded(batchId, dataHash, msg.sender);
    }

    /// @notice Certifies the batch (once).
    function certifyBatch(uint256 batchId) external onlyInspector {
        _requireOwned(batchId);
        Batch storage b = _batches[batchId];
        if (b.certified) revert AlreadyCertified();
        b.certified = true;
        emit BatchCertified(batchId, msg.sender);
    }

    // ------------------------------------------------------------------- escrow

    /// @inheritdoc IBatchRegistry
    function recordSalePrice(uint256 batchId, uint256 price) external {
        if (msg.sender != escrow) revert NotEscrow();
        if (price == 0) revert ZeroPrice();
        if (price > type(uint128).max) revert PriceTooHigh();
        _requireOwned(batchId);
        _batches[batchId].lastPrice = uint128(price);
        emit PriceRecorded(batchId, price);
    }

    // -------------------------------------------------------------------- views

    /// @inheritdoc IBatchRegistry
    function isCertified(uint256 batchId) external view returns (bool) {
        _requireOwned(batchId);
        return _batches[batchId].certified;
    }

    /// @inheritdoc IBatchRegistry
    function getLastPrice(uint256 batchId) external view returns (uint256) {
        _requireOwned(batchId);
        return _batches[batchId].lastPrice;
    }

    /// @inheritdoc IBatchRegistry
    function custodianOf(uint256 batchId) external view returns (address) {
        return _requireOwned(batchId);
    }

    /// @notice Number of batches minted so far.
    function totalBatches() external view returns (uint256) {
        return _nextId - 1;
    }

    // ---------------------------------------------------------------- internals

    /// @dev Every ownership change (including standard ERC-721 transfers) is a custody change.
    function _update(address to, uint256 tokenId, address auth) internal override returns (address from) {
        from = super._update(to, tokenId, auth);
        if (from != address(0)) emit CustodyTransferred(tokenId, from, to);
    }
}
