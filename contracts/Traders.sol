pragma solidity >=0.4.21 < 0.7.0;
pragma experimental ABIEncoderV2;

/// @title Traders
/// @notice The contract where traders are listed.
contract Traders {
    //Maps accounts to bools, indicating the account is used for a trader
    mapping (address => bool) accountUsed;
    /// @notice
    mapping (address => string) traderName;

    address[] traders;

    /// @notice Sign up as a trader
    /// @dev
    /// @param _name The name of the trader for identification purposes.
    function newTrader(string memory _name) public {
        require(!accountUsed[msg.sender], "Account already has a trader");
        accountUsed[msg.sender] = true;
        traderName[msg.sender] = _name;
        traders.push(msg.sender);
    }

    /// @notice Check that an account is listed as a trader.
    /// @param _account The address of the account to check.
    /// @return A boolean that indicates whether the account is listed as a trader.
    function accountHasTrader(address _account) public view returns (bool) {
        return accountUsed[_account];
    }

    /// @notice Get the name of a trader.
    /// @param _account The address of the account to get a name for
    /// @return The name of the trader.
    function getTraderName(address _account) public view returns (string memory) {
        require(accountHasTrader(_account), "The account must be listed as trader");
        return traderName[_account];
    }


    function getTraders() public view returns (address[] memory) {
        return traders;
    }
}
