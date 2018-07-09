pragma solidity ^0.4.24;

import "./trader.sol";

contract Traders {
    //Maps accounts to bools, indicating the account is used for a trader
    mapping (address => bool) accountUsed;

    //Collection of traders
    address[] traders;

    //Maps accounts to their associated traders
    mapping (address => address) traderForAccount;

    //Maps trader addresses to their names
    mapping (address => string) traderName;

    function newTrader(string name) public {
        address account = msg.sender;
        //Check if the account already has a trader
        require(!accountUsed[account], "Account already used");
        accountUsed[account] = true;
        Trader trader = new Trader(name, account);
        traderForAccount[account] = trader;
        traderName[trader] = name;
        traders.push(trader);
    }

    function getTraders() public view returns (address[]) {
        return traders;
    }

    function accountHasTrader(address _account) public view returns (bool) {
        return accountUsed[_account];
    }

    function getTraderForAccount(address _account) public view returns (address) {
        return traderForAccount[_account];
    }

    function getTraderName(address _trader) public view returns (string) {
        return traderName[_trader];
    }

    function getName() public pure returns (string) {
        return "Trader collection";
    }
}