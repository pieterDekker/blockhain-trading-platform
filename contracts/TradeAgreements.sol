pragma solidity >=0.4.21 <0.7.0;
pragma experimental ABIEncoderV2;

import { Leadership } from "./Leadership.sol";
import { Registry } from "./Registry.sol";
import { RestrictedToTrader } from "./RestrictedToTrader.sol";
import { RestrictedToLeader } from "./RestrictedToLeader.sol";
import { PaymentAgreements } from "./PaymentAgreements.sol";
import { Traders } from "./Traders.sol";

/// @title TradeAgreements
/// @notice This contract stores traderagreements and allows for interactions with it
contract TradeAgreements is RestrictedToTrader, RestrictedToLeader {
    event NewTradeAgreement(uint index, address offerOwner, address demandOwner);
    event VolumeClaimed(uint index, address offerOwner, address demandOwner);
    event VolumeConfirmed(uint index, address offerOwner, address demandOwner);

    struct TradeAgreement {
        address offerOwner;
        bytes offerPath;
        address demandOwner;
        bytes demandPath;
        uint volumeGoal;
        uint volumeActual;
        uint volumeClaimed;
        uint unitPrice;
        bool agreementCreated;
    }

    TradeAgreement[] private agreements;
    mapping (address => uint[]) agreementsPerTrader;

    Leadership private leadership;
    Registry private registry;
    PaymentAgreements private paymentAgreements;
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
        paymentAgreements = PaymentAgreements(registry.getPaymentAgreements());
        traders = Traders(registry.getTraders());
    }

    /// @notice Create a new trade agreement.
    /// @param _offerOwner The address of the owner of the offer.
    /// @param _offerPath The IPFS path to the offer.
    /// @param _demandOwner The address of the owner of the demand.
    /// @param _demandPath The IPFS path to the demand.
    /// @param _volume The amount of units of the desired good that the demand owner will receive.
    /// @param _unitPrice The price per unit that the demand owner will have to pay.
    function create(
        address _offerOwner,
        bytes memory _offerPath,
        address _demandOwner,
        bytes memory _demandPath,
        uint _volume,
        uint _unitPrice
    ) public MinerMustBeLeader(leadership) {
        agreements.push(
            TradeAgreement(
                {
                offerOwner: _offerOwner,
                offerPath: _offerPath,
                demandOwner: _demandOwner,
                demandPath: _demandPath,
                volumeGoal: _volume,
                volumeActual: 0,
                volumeClaimed: 0,
                unitPrice: _unitPrice,
                agreementCreated: false
                }
            )
        );
        emit NewTradeAgreement(agreements.length - 1, _offerOwner, _demandOwner);
    }

    /// @notice Retrieve a trade agreement.
    /// @param id The index of the desired trade agreeement.
    function get(uint id) public view SenderMustBeTrader(traders) returns (TradeAgreement memory) {
        return agreements[id];
    }

    /// @notice Claim that a certain volume of the desired good is sent.
    /// @param index The index of the trade agreement.
    /// @param _volumeClaimed The amount that is claimed to be sent.
    function claimVolume(uint index, uint _volumeClaimed) public SenderMustBeTrader(traders) MinerMustBeLeader(leadership) {
        require(msg.sender == agreements[index].offerOwner, "Only the owner of the offer can claim a volume");
        agreements[index].volumeClaimed = _volumeClaimed;
        emit VolumeClaimed(index, agreements[index].offerOwner, agreements[index].demandOwner);
    }

    /// @notice Confirm that a certain volume of the desired good is sent.
    /// @param index The index of the trade agreement.
    function confirmVolume(uint index) public SenderMustBeTrader(traders) MinerMustBeLeader(leadership) {
        TradeAgreement storage agreement = agreements[index];
        require(msg.sender == agreement.demandOwner, "Only the owner of the demand can confirm a claim");
        agreement.volumeActual = agreement.volumeClaimed;
        emit VolumeConfirmed(index, agreements[index].offerOwner, agreements[index].demandOwner);
        if (agreement.volumeActual >= agreement.volumeGoal) {
            paymentAgreements.create(
                agreement.offerOwner,
                agreement.offerPath,
                agreement.demandOwner,
                agreement.demandPath,
                agreement.volumeGoal * agreement.unitPrice
            );
            agreement.agreementCreated = true;
        }
    }
}
