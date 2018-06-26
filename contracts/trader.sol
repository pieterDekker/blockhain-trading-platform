pragma solidity ^0.4.24;

import "./offer.sol";
import "./demand.sol";

contract Trader {
    address[] private offers;
    address[] private demands;
    address[] private send_agreements_l;
    address[] private recv_agreements_l;
    address private owner;
    string private name;

    /**
     *
     */
    struct UpdateClaim {
        int number;
        int amount;
    }

    mapping (address => UpdateClaim[]) update_claims;
    mapping (address => bool) send_agreements_m;
    mapping (address => bool) recv_agreements_m;

    constructor (string _name) public {
        owner = msg.sender;
        name = _name;
    }

    function deployOffer(int _volume, int _price_per_unit, uint _expiration_time) public {
        require(msg.sender == owner);
        address offer = new Offer(_volume, _price_per_unit, _expiration_time);
        offers.push(offer);
    }
    
    function deployDemand(int _volume, int _price_per_unit, uint _expiration_time) public {
        require(msg.sender == owner);
        address demand = new Demand(_volume, _price_per_unit, _expiration_time);
        demands.push(demand);
    }

    function getOffers() public view returns (address[]) {
        require(msg.sender == owner);
        return offers;
    }

    function getDemands() public view returns (address[]) {
        require(msg.sender == owner);
        return demands;
    }

    function getName() public view returns (string) {
        require(msg.sender == owner);
        return name;
    }

    function addSendAgreement(address _send_agreement) public {
        send_agreements_m[_send_agreement] = true;
        send_agreements_l.push(_send_agreement);
    }

    function addReceiveAgreement(address _recv_agreement) public {
        recv_agreements_m[_recv_agreement] = true;
        recv_agreements_l.push(_recv_agreement);
    }

    // function addUpdateClaim(int _claim_number, int _claim_amount) public {
    //     require(send_agreements_m[msg.sender] == true);
    //     update_claims[msg.sender].push(UpdateClaim(_claim_number,_claim_amount));
    // }
}