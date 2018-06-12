pragma solidity ^0.4.24;

import "./bid.sol";

contract Demand is Bid {
    constructor (int _volume, int _price_per_unit, uint _expiration_time) public {
        setName("Demand");
        setOwner(msg.sender);
        setVolume(_volume);
        setPricePerUnit(_price_per_unit);
        setExpirationTime(_expiration_time);
    }
}