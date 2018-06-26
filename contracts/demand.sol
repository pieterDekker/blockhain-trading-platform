pragma solidity ^0.4.24;

import "./bid.sol";

contract Demand is Bid {
    constructor (int _volume, int _unit_price, uint _expiration_time) public {
        setName("Demand");
        setOwner(msg.sender);
        setVolume(_volume);
        setPricePerUnit(_unit_price);
        setExpirationTime(_expiration_time);
    }
}