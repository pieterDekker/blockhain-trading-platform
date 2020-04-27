pragma solidity >=0.4.21 < 0.7.0;
pragma experimental ABIEncoderV2;

import { Leadership } from "./Leadership.sol";
import { Marketplace } from "./Marketplace.sol";
import { Registry } from "./Registry.sol";
import { RestrictedToTrader } from "./RestrictedToTrader.sol";
import { RestrictedToLeader } from "./RestrictedToLeader.sol";
import { TradeAgreements } from "./TradeAgreements.sol";
import { Traders } from "./Traders.sol";

/// @title Matches
/// @notice Where matches are published
contract Matches is RestrictedToTrader, RestrictedToLeader {
    event NewMatch(uint index, address offerOwner, address demandOwner);

    struct Match {
        address offerOwner;
        bytes offerPath;
        bool offerOwnerAccepted;
        address demandOwner;
        bytes demandPath;
        bool demandOwnerAccepted;
        uint volume;
        uint unitPrice;
        bool agreementCreated;
    }
    
    Registry private registry;
    TradeAgreements private tradeAgreements;
    Traders private traders;
    Leadership private leadership;

    Match[] private _matches;

    uint private current_matches_amount = 0;

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
        tradeAgreements = TradeAgreements(registry.getTradeAgreements());
        traders = Traders(registry.getTraders());
        leadership = Leadership(registry.getLeadership());
    }

    /// @notice Publish a new match.
    /// @param _offerOwner The address of the owner of the offer.
    /// @param _offerPath The IPFS path to the offer.
    /// @param _demandOwner The address of the owner of the demand.
    /// @param _demandPath The IPFS path to the demand.
    /// @param _volume The amount of units of the desired good that the demand owner will receive.
    /// @param _unitPrice The price per unit that the demand owner will have to pay.
    function publish (
        address _offerOwner,
        bytes memory _offerPath,
        address _demandOwner,
        bytes memory _demandPath,
        uint _volume,
        uint _unitPrice
    ) public SenderMustBeTrader(traders) SenderMustBeLeader(leadership) MinerMustBeLeader(leadership) {
        if (current_matches_amount == _matches.length) {
            Match memory m = Match({
                offerOwner: _offerOwner,
                offerPath: _offerPath,
                offerOwnerAccepted: false,
                demandOwner: _demandOwner,
                demandPath: _demandPath,
                demandOwnerAccepted: false,
                volume: _volume,
                unitPrice: _unitPrice,
                agreementCreated: false
            });
            _matches.push(m);
        } else {
            _matches[current_matches_amount].offerOwner = _offerOwner;
            _matches[current_matches_amount].offerPath = _offerPath;
            _matches[current_matches_amount].offerOwnerAccepted = false;
            _matches[current_matches_amount].demandOwner = _demandOwner;
            _matches[current_matches_amount].demandPath = _demandPath;
            _matches[current_matches_amount].demandOwnerAccepted = false;
            _matches[current_matches_amount].volume = _volume;
            _matches[current_matches_amount].unitPrice= _unitPrice;
            _matches[current_matches_amount].agreementCreated = false;
        }
        emit NewMatch(current_matches_amount, _offerOwner, _demandOwner);
        current_matches_amount++;
    }

    /// @notice Modify a function to require the index to be in range
    /// @param index The index that is requested.
    modifier MustBeInRange(uint index) {
      require(index < current_matches_amount, "There is no match with that index");
      _;
    }

    /// @notice Retrieve a match by index
    /// @param index The index of the match.
    /// @return The match if it exists.
    function get(uint index) public view SenderMustBeTrader(traders) MustBeInRange(index) returns (Match memory) {
        return _matches[index];
    }

    /// @notice Accept a match as the owner of a demand.
    /// @param index The index of the match.
    function acceptOffer(uint index) public SenderMustBeTrader(traders) MinerMustBeLeader(leadership) MustBeInRange(index) {
        require(msg.sender == _matches[index].demandOwner, "Only the owner of a demand can accept an offer");
        _matches[index].demandOwnerAccepted = true;
        if (_matches[index].offerOwnerAccepted) {
            createTradeAgreement(index);
        }
    }

    /// @notice Accept a match as the owner of an offer.
    /// @param index The index of the match.
    function acceptDemand(uint index) public SenderMustBeTrader(traders) MinerMustBeLeader(leadership) MustBeInRange(index) {
        require(msg.sender == _matches[index].offerOwner, "Only the owner of an offer can accept an demand");
        _matches[index].offerOwnerAccepted = true;
        if (_matches[index].demandOwnerAccepted) {
            createTradeAgreement(index);
        }
    }

    /// @notice Create a payment agreement
    /// @param index The index of the match for which a trade agreement should be created.
    function createTradeAgreement(uint index) private MustBeInRange(index) {
        require(_matches[index].demandOwnerAccepted);
        require(_matches[index].offerOwnerAccepted);
        require(!(_matches[index].agreementCreated));
        Match storage m = _matches[index];
        tradeAgreements.create(
            m.offerOwner,
            m.offerPath,
            m.demandOwner,
            m.demandPath,
            m.volume,
            m.unitPrice
        );
        _matches[index].agreementCreated = true;
    }

    function newRound(Match[] memory _newMatches) public SenderMustBeLeader(leadership) {
        current_matches_amount = 0;
        for (uint i = 0; i < _newMatches.length; i++) {
            publish(
                _newMatches[i].offerOwner,
                _newMatches[i].offerPath,
                _newMatches[i].demandOwner,
                _newMatches[i].demandPath,
                _newMatches[i].volume,
                _newMatches[i].unitPrice
            );
        }
        Marketplace(registry.getMarketplace()).reset();
    }
}
