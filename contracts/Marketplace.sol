pragma solidity >=0.4.21 <0.7.0;
pragma experimental ABIEncoderV2;

import { Leadership } from "./Leadership.sol";
import { Registry } from "./Registry.sol";
import { RestrictedToTrader } from "./RestrictedToTrader.sol";
import { RestrictedToLeader } from "./RestrictedToLeader.sol";
import { Traders } from "./Traders.sol";

/// @title The marketplace contract, where offers and demands are published
contract Marketplace is RestrictedToTrader, RestrictedToLeader {
    event NewOffer(uint index);
    event NewDemand(uint index);

    bytes[] private _offers;
    bytes[] private _demands;

    uint private current_offers_amount = 0;
    uint private current_demands_amount = 0;
    uint private offers_cap;
    uint private demands_cap;

    Registry private registry;
    Leadership private leadership;
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

    /// @notice Publish an offer by posting its IPFS file path as an array of bytes.
    /// @param _ipfs_file_id The bytes of the IPFS file path.
    /// @dev Emits a NewOffer event containing the index of the offer that was published.
    function publishOffer(bytes memory _ipfs_file_id) public SenderMustBeTrader(traders) MinerMustBeLeader(leadership) {
        if (current_offers_amount == _offers.length) {
            _offers.push(_ipfs_file_id);
        } else {
            _offers[current_offers_amount] = _ipfs_file_id;
        }
        emit NewOffer(current_offers_amount);
        current_offers_amount++;
    }

    /// @notice Publish a demand by posting its IPFS file path as an array of bytes.
    /// @param _ipfs_file_id The bytes of the IPFS file path.
    /// @dev Emits a NewDemand event containing the index of the demand that was published.
    function publishDemand(bytes memory _ipfs_file_id) public SenderMustBeTrader(traders) MinerMustBeLeader(leadership) {
        if (current_demands_amount == _demands.length) {
            _demands.push(_ipfs_file_id);
        } else {
            _demands[current_demands_amount] = _ipfs_file_id;
        }
        emit NewDemand(current_demands_amount);
        current_demands_amount++;
    }

    /// @notice Publish a list of offers by posting and array of IPFS file paths, each an array of bytes.
    /// @param _ipfs_file_ids The list of IPFS file paths, each in bytes form.
    /// @dev Emits a NewOffer event containing the index of the offer that was published for each offer published.
    function publishOffers(bytes[] memory _ipfs_file_ids) public SenderMustBeTrader(traders) MinerMustBeLeader(leadership) {
        for (uint i = 0; i < _ipfs_file_ids.length; i++) {
            publishOffer(_ipfs_file_ids[i]);
        }
    }

    /// @notice Publish a list of demands by posting and array of IPFS file paths, each an array of bytes.
    /// @param _ipfs_file_ids The list of IPFS file paths, each in bytes form.
    /// @dev Emits a NewDemand event containing the index of the demand that was published for each demand published.
    function publishDemands(bytes[] memory _ipfs_file_ids) public SenderMustBeTrader(traders) MinerMustBeLeader(leadership) {
        for (uint i = 0; i < _ipfs_file_ids.length; i++) {
            publishDemand(_ipfs_file_ids[i]);
        }
    }

    /// @notice Get the amount of offers published at this moment
    /// @return The amount of offers published at this moment
    function getCurrentOffersAmount() public view SenderMustBeTrader(traders) returns(uint) {
        return current_offers_amount;
    }

    /// @notice Get the amount of demands published at this moment
    /// @return The amount of demands published at this moment
    function getCurrentDemandsAmount() public view SenderMustBeTrader(traders) returns(uint) {
        return current_demands_amount;
    }

    /// @notice Get a specific offer.
    /// @dev Emits a NewDemand event containing the index of the demand that was published for each demand published.
    function getOffer(uint id) public view SenderMustBeTrader(traders) returns (bytes memory ipfs_file_id) {
        require(id < current_offers_amount, "There is not offer with that index");
        return _offers[id];
    }

    /// @notice Get a specific demand.
    /// @dev Emits a NewDemand event containing the index of the demand that was published for each demand published.
    function getDemand(uint id) public view SenderMustBeTrader(traders) returns (bytes memory ipfs_file_id) {
        require(id < current_demands_amount, "There is no demand with that index");
        return _demands[id];
    }

    /// @notice Reset the contract. To be called only at the end of a round.
    function reset() public SenderMustBeLeader (leadership) {
        current_offers_amount = 0;
        current_demands_amount = 0;
    }
}
