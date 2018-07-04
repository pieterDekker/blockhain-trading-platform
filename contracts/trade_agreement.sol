pragma solidity ^0.4.24;

import "./offer.sol";
import "./demand.sol";
import "./trader.sol";

contract TradeAgreement {
    address private sender;
    address private receiver;
    address private offer;
    address private demand;

    int private update_counter;

    mapping (int => int) private updates;

    int volume_required;
    int volume_sent;
    int unit_price;

    constructor (address _offer, address _demand) public {
        //Set offer and demand addresses
        offer = _offer;
        demand = _demand;

        //Get offer and demand instances
        Offer offer_c = Offer(offer);
        Demand demand_c = Demand(demand);

        //Set sender and receiver addresses
        sender = offer_c.getOwner();
        receiver = demand_c.getOwner();

        //Get sender and receiver instances
        Trader sender_c = Trader(sender);
        Trader receiver_c = Trader(receiver);

        //Add agreemenent to sender and receiver appropriately
        sender_c.addSendAgreement(this);
        receiver_c.addReceiveAgreement(this);
    }

    // function addUpdate (int _amount) public {
    //     require(msg.sender == address(sender));
    //     updates[update_counter++] = _amount;
    // }


    // function confirmUpdate (int update_number) public {
    //     require(msg.sender == address(receiver));
    //     volume_sent += updates[update_number];
    //     updates[update_number] = 0;
    // }
    
    function getDetails () public view returns (
        int _volume_required, 
        int _volume_sent, 
        int _unit_price, 
        address _sender, 
        address _receiver, 
        address _offer,
        address _demand
        ) {
        return (
            volume_required,
            volume_sent,
            unit_price,
            sender,
            receiver,
            offer,
            demand
        );
    }

    string private name = "trade agreement";
    
    function getName() public view returns (string) {
        return name;
    }
}