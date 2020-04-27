pragma solidity >=0.4.21 < 0.7.0;

/// @title Registry
/// @notice A registry of contracts for proper functioning of the application.
contract Registry {
  address private leadership;
  address private marketplace;
  address private paymentAgreements;
  address private traders;
  address private tradeAgreements;

  constructor (address _leadership, address _marketplace, address _paymentAgreements, address _tradeAgreements, address _traders) public {
    leadership = _leadership;
    marketplace = _marketplace;
    paymentAgreements = _paymentAgreements;
    traders = _traders;
    tradeAgreements = _tradeAgreements;
  }

  ///@notice Returns the address of the leadership contract
  ///@return The address of the leadership contract.
  function getLeadership() public view returns (address) {
    require(leadership != address(0), "There must be a leadership address set");
    return leadership;
  }

  ///@notice Returns the address of the marketplace contract
  ///@return The address of the marketplace contract.
  function getMarketplace() public view returns (address) {
    require(marketplace != address(0), "There must be a marketplace address set");
    return marketplace;
  }

  ///@notice Returns the address of the paymentAgreements contract
  ///@return The address of the paymentAgreements contract.
  function getPaymentAgreements() public view returns (address) {
    require(paymentAgreements != address(0), "There must be a paymentAgreements address set");
    return paymentAgreements;
  }

  ///@notice Returns the address of the tradeAgreements contract
  ///@return The address of the tradeAgreements contract.
  function getTradeAgreements() public view returns (address) {
    require(tradeAgreements != address(0), "There must be a tradeAgreements address set");
    return tradeAgreements;
  }

  ///@notice Returns the address of the traders contract
  ///@return The address of the traders contract.
  function getTraders() public view returns (address) {
    require(traders != address(0), "There must be a traders address set");
    return traders;
  }
}
