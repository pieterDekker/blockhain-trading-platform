pragma solidity ^0.4.24;

import "./offer.sol";
import "./demand.sol";

contract Trader {
    address[] private offers;
    address[] private demands;
    address private owner;
    string private name;

    constructor (string _name) public {
        owner = msg.sender;
        name = _name;
    }

    function deployOffer(int _volume, int _price_per_unit, uint _expiration_time) public {
        require(msg.sender == owner);
        address offer = new Offer(_volume, _price_per_unit, _expiration_time);
        offers.push(offer);
    }
    
    function deployDemand(int _volume, int _price_per_unit, uint _expiration_time) public {
        require(msg.sender == owner);
        address demand = new Demand(_volume, _price_per_unit, _expiration_time);
        offers.push(demand);
    }

    function addOffer(address _offer) public {
        require(msg.sender == owner);
        offers.push(_offer);
    }

    function getOffers() public view returns (address[] _) {
        require(msg.sender == owner);
        return offers;
    }

    function addDemand(address _demand) public {
        require(msg.sender == owner);
        demands.push(_demand);
    }

    function getDemands() public view returns (address[] _) {
        require(msg.sender == owner);
        return demands;
    }
}