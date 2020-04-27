pragma solidity >=0.4.21 <0.7.0;

import { Traders } from "./Traders.sol";

/// @title RestrictedToTrader
contract RestrictedToTrader {
  bool private enableTraderRestrictions;

  /// @param _enableTraderRestrictions If set to true, senders of certain transactions must be listed in the Traders contract.
  constructor (bool _enableTraderRestrictions) internal {
    enableTraderRestrictions = _enableTraderRestrictions;
  }

  /// @dev A modifier that requires the sender of a transaction to be listed as trader in the Traders contract.
  modifier SenderMustBeTrader(Traders traders) {
    if (enableTraderRestrictions) {
      require(traders.accountHasTrader(msg.sender), "This function can only be called by a trader");
    }
    _;
  }

  /// @return A boolean indicating whether trader restrictions are enabled.
  function senderRestrictionsEnabled() public view returns (bool) {
    return enableTraderRestrictions;
  }
}
