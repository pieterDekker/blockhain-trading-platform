pragma solidity ^0.4.25;

contract Trader {
    address private owner;
    string private name;

    constructor (string _name) public {
        owner = msg.sender;
        name = _name;
    }
}