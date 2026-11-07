// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IBatchRegistry} from "../interfaces/IBatchRegistry.sol";

/// @title PriceCapEscrow
/// @notice Holds buyer OLV until the batch is certified and delivered. Enforces the markup cap.
contract PriceCapEscrow is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum State { None, Created, Deposited, Released, Refunded, Cancelled }

    struct Sale {
        address seller;
        State state;
        address buyer;
        uint256 batchId;
        uint256 price;
    }

    uint16 public constant MAX_MARKUP_PERCENT = 1000;

    IBatchRegistry public immutable registry;
    IERC20 public immutable token;
    uint16 public maxMarkupPercent;
    uint256 public saleCount;
    mapping(uint256 => Sale) private _sales;

    event SaleCreated(uint256 indexed saleId, uint256 indexed batchId, address indexed seller, uint256 price);
    event Deposited(uint256 indexed saleId, address indexed buyer, uint256 price);
    event PaymentReleased(uint256 indexed saleId, address indexed seller, uint256 price);
    event Refunded(uint256 indexed saleId, address indexed buyer, uint256 price);
    event SaleCancelled(uint256 indexed saleId);
    event MarkupChanged(uint16 percent);

    error ZeroAddress();
    error ZeroPrice();
    error InvalidMarkup();
    error NotCustodian();
    error NotSeller();
    error NotBuyer();
    error PriceAboveCap(uint256 price, uint256 cap);
    error WrongState(State current);
    error SelfSale();
    error NotCertified();
    error CustodyNotMoved();
    error ConditionsMet();

    constructor(IBatchRegistry registry_, IERC20 token_, uint16 initialMarkupPercent) Ownable(msg.sender) {
        if (address(registry_) == address(0) || address(token_) == address(0)) revert ZeroAddress();
        if (initialMarkupPercent > MAX_MARKUP_PERCENT) revert InvalidMarkup();
        registry = registry_;
        token = token_;
        maxMarkupPercent = initialMarkupPercent;
    }

    /// @notice Sets the max markup over the last declared price. Market authority only.
    function setMaxMarkup(uint16 percent) external onlyOwner {
        if (percent > MAX_MARKUP_PERCENT) revert InvalidMarkup();
        maxMarkupPercent = percent;
        emit MarkupChanged(percent);
    }

    /// @notice Highest price a seller may ask for `batchId` right now.
    function priceCap(uint256 batchId) public view returns (uint256) {
        return (registry.getLastPrice(batchId) * (100 + maxMarkupPercent)) / 100;
    }

    /// @notice Seller lists the batch. Reverts if the price exceeds the cap.
    function createSale(uint256 batchId, uint256 price) external returns (uint256 saleId) {
        if (price == 0) revert ZeroPrice();
        if (registry.custodianOf(batchId) != msg.sender) revert NotCustodian();
        uint256 cap = priceCap(batchId);
        if (price > cap) revert PriceAboveCap(price, cap);
        unchecked {
            saleId = ++saleCount; // cannot overflow in practice
        }
        _sales[saleId] = Sale(msg.sender, State.Created, address(0), batchId, price);
        emit SaleCreated(saleId, batchId, msg.sender, price);
    }

    /// @notice Seller withdraws a sale that has no deposit yet.
    function cancelSale(uint256 saleId) external {
        Sale storage s = _sales[saleId];
        if (s.seller != msg.sender) revert NotSeller();
        if (s.state != State.Created) revert WrongState(s.state);
        s.state = State.Cancelled;
        emit SaleCancelled(saleId);
    }

    /// @notice Buyer locks OLV in escrow (needs a prior `approve`).
    function deposit(uint256 saleId) external nonReentrant {
        Sale storage s = _sales[saleId];
        if (s.state != State.Created) revert WrongState(s.state);
        if (s.seller == msg.sender) revert SelfSale();
        s.state = State.Deposited;
        s.buyer = msg.sender;
        uint256 price = s.price;
        emit Deposited(saleId, msg.sender, price);
        token.safeTransferFrom(msg.sender, address(this), price);
    }

    /// @notice Pays the seller once the batch is certified and held by the buyer. Anyone may call.
    function releasePayment(uint256 saleId) external nonReentrant {
        Sale storage s = _sales[saleId];
        if (s.state != State.Deposited) revert WrongState(s.state);
        uint256 batchId = s.batchId;
        if (!registry.isCertified(batchId)) revert NotCertified();
        if (registry.custodianOf(batchId) != s.buyer) revert CustodyNotMoved();
        s.state = State.Released;
        address seller = s.seller;
        uint256 price = s.price;
        emit PaymentReleased(saleId, seller, price);
        token.safeTransfer(seller, price);
        registry.recordSalePrice(batchId, price);
    }

    /// @notice Buyer takes the OLV back while the delivery conditions are not both met.
    function refund(uint256 saleId) external nonReentrant {
        Sale storage s = _sales[saleId];
        if (s.state != State.Deposited) revert WrongState(s.state);
        if (s.buyer != msg.sender) revert NotBuyer();
        uint256 batchId = s.batchId;
        if (registry.isCertified(batchId) && registry.custodianOf(batchId) == msg.sender) revert ConditionsMet();
        s.state = State.Refunded;
        uint256 price = s.price;
        emit Refunded(saleId, msg.sender, price);
        token.safeTransfer(msg.sender, price);
    }

    /// @notice Sale data.
    function getSale(uint256 saleId) external view returns (Sale memory) {
        return _sales[saleId];
    }
}
