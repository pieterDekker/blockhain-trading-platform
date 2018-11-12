pragma solidity ^0.4.25;

import {Trader} from "trader.sol";

contract Traders {
    //Maps accounts to bools, indicating the account is used for a trader
    mapping (address => bool) accountUsed;

    //Collection of traders
//    address[] traders;

    //Collection of accounts
//    address[] accounts;

    //Maps accounts to their associated traders
    mapping (address => address) traderForAccount;

    function newTrader(string name) public {
        require(!accountUsed[msg.sender], "Account already has a trader");

        Trader trader = new Trader(name);
        traderForAccount[msg.sender] = trader;
        accountUsed[msg.sender] = true;
    }

//    function getTraders() public view returns (address[]) {
//        return traders;
//    }
//
//    function getAccounts() public view returns (address[]) {
//        return accounts;
//    }

    function accountHasTrader(address _account) public view returns (bool) {
        return accountUsed[_account];
    }

    function getTraderForAccount(address _account) public view returns (address) {
        return traderForAccount[_account];
    }

    function getName() public pure returns (string) {
        return "Trader collection";
    }
}