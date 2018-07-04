pragma solidity ^0.4.24;

import "./trader.sol";

contract Traders {
    address[] accounts;
    address[]

    mapping (address => bool) traderExists;
    mapping (address => string) traderName;
    mapping (address => )

    function newTrader(string name) public {
        address trader = msg.sender;
        if (!traderExists[trader]) {
            traderExists[trader] = true;
            accounts.push(trader);
            traderName[trader] = name;
        }
    }

    function getTraders() public view returns (address[]) {
        return traders;
    }

    function getTraderName() public view

}