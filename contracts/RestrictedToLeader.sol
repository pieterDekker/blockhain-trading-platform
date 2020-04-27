pragma solidity >=0.4.21 <0.7.0;

import { Leadership } from "./Leadership.sol";

/// @title RestrictedToLeader
contract RestrictedToLeader {
  // Leadership private leadership;

  bool private enableLeaderRestrictions;

  /// @param _enableLeaderRestrictions If set to true, certain transactions can only be mined by the account that is listed as leader in the Leadership contract.
  constructor (bool _enableLeaderRestrictions) internal {
    // leadership = Leadership(_leadership);
    enableLeaderRestrictions = _enableLeaderRestrictions;
  }

  /// @dev A modifier that requires the miner of a transaction to be listed as leader in the leadership contract.
  modifier MinerMustBeLeader(Leadership leadership) {
    if (enableLeaderRestrictions) {
      require(leadership.getCurrentLeader() != address(0), "There must be a leader if leader restrictions are enabled");
      require(block.coinbase == leadership.getCurrentLeader(), "Only the leader can mine this transaction");
    }
    _;
  }

  /// @dev A modifier that requires the sender of a transaction to be listed as leader in the Leadership contract.
  modifier SenderMustBeLeader(Leadership leadership) {
    if (enableLeaderRestrictions) {
      require(leadership.getCurrentLeader() != address(0), "There must be a leader if leader restrictions are enabled");
      require(msg.sender == leadership.getCurrentLeader(), "Only the leader can send this transaction");
    }
    _;
  }

  /// @notice leaving this in for debugging purposes
  function getMiner() public view returns (address) {
    return block.coinbase;
  }

  /// @return A boolean indicating whether miner restrictions are enabled.
  function minerRestrictionsEnabled() public view returns (bool) {
    return enableLeaderRestrictions;
  }
}
