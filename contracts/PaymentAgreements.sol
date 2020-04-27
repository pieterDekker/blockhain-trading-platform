pragma solidity >=0.4.21 <0.7.0;
pragma experimental ABIEncoderV2;

import { Leadership } from "./Leadership.sol";
import { Registry } from "./Registry.sol";
import { RestrictedToTrader } from "./RestrictedToTrader.sol";
import { RestrictedToLeader } from "./RestrictedToLeader.sol";
import { PaymentAgreements } from "./PaymentAgreements.sol";
import { Traders } from "./Traders.sol";

/// @title PaymentAgreements
/// @notice Where payment agreements are listed
contract PaymentAgreements is RestrictedToTrader, RestrictedToLeader {
    event NewPaymentAgreement(uint index, address offerOwner, address demandOwner);
    event PaymentAgreementFinished(uint index, address offerOwner, address demandOwner);

    struct PaymentAgreement {
        address offerOwner;
        bytes offerPath;
        address demandOwner;
        bytes demandPath;
        uint amountGoal;
        uint amountActual;
        uint amountClaimed;
        bool finished;
    }

    /// @notice
    PaymentAgreement[] private agreements;

    // todo: implement this further.
    // idea: per-trader collection of agreements for quick lookup for each individual trader
    mapping (address => uint[]) agreementsPerTrader;
    
    Leadership private leadership;
    Registry private registry;
    Traders private traders;

    /// @notice
    /// @dev Enable or disable restictions by passing in false for the appropriate flags if desired.
    /// @param _enableTraderRestrictions If set to true, senders of certain transactions must be listed in the Traders contract.
    /// @param _enableLeaderRestrictions If set to true, certain transactions can only be mined by the account that is listed as leader in the Leadership contract.
    constructor
    (bool _enableTraderRestrictions, bool _enableLeaderRestrictions)
    public
    RestrictedToTrader(_enableTraderRestrictions)
    RestrictedToLeader(_enableLeaderRestrictions)
    {}

    function initialize (address _registry) public {
        registry = Registry(_registry);
        leadership = Leadership(registry.getLeadership());
        traders = Traders(registry.getTraders());
    }

    /// @notice Create a payment agreement.
    /// @param _offerOwner The address of the owner of the offer.
    /// @param _offerPath The IPFS path to the offer.
    /// @param _demandOwner The address of the owner of the demand.
    /// @param _demandPath The IPFS path to the demand.
    /// @param _amount The amount of payment to be made.
    function create(
        address _offerOwner,
        bytes memory _offerPath,
        address _demandOwner,
        bytes memory _demandPath,
        uint _amount
    ) public {
        require(msg.sender == address(registry.getTradeAgreements()), "Only the TradeAgreements contract can creat payment agreements");
        agreements.push(
            PaymentAgreement(
                {
                offerOwner: _offerOwner,
                offerPath: _offerPath,
                demandOwner: _demandOwner,
                demandPath: _demandPath,
                amountGoal: _amount,
                amountActual: 0,
                amountClaimed: 0,
                finished: false
                }
            )
        );
        emit NewPaymentAgreement(agreements.length - 1, _offerOwner, _demandOwner);
    }

    /// @notice Retrieve a payment agreement by index.
    /// @param index The index of the desired payment agreeement.
    /// @return The trade agreement
    function get(uint index) public view SenderMustBeTrader(traders) returns (PaymentAgreement memory) {
        return agreements[index];
    }

    /// @notice Claim that a certain amount of payment is sent.
    /// @param index The index of the payment agreement.
    /// @param _amountClaimed The amount that is claimed to be sent.
    function claimAmount(uint index, uint _amountClaimed) public SenderMustBeTrader(traders) MinerMustBeLeader(leadership) {
        require(msg.sender == agreements[index].demandOwner, "Only the owner of the demand can claim an amount");
        agreements[index].amountClaimed = _amountClaimed;
    }

    /// @notice Confirm that a certain amount of payment is sent.
    /// @param index The index of the payment agreement.
    function confirmAmount(uint index) public SenderMustBeTrader(traders)  MinerMustBeLeader(leadership) {
        require(msg.sender == agreements[index].offerOwner, "Only the owner of the offer can confirm an amount");
        agreements[index].amountActual = agreements[index].amountClaimed;
        if (agreements[index].amountActual >= agreements[index].amountGoal) {
            agreements[index].finished = true;
            emit PaymentAgreementFinished(index, agreements[index].offerOwner, agreements[index].demandOwner);
        }
    }
}
