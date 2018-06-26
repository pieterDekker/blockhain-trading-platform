pragma solidity ^0.4.24;

// import "./offer.sol";
// import "./demand.sol";
// import "./trader.sol";

// contract Agreement {
//     address private sender;
//     address private receiver;
//     address private offer;
//     address private demand;

//     int private update_counter;

//     mapping (int => int) private updates;

//     constructor (address _offer, address _demand) public {
//         offer = _offer;
//         demand = _demand;
//         Offer offer_c = Offer(offer);
//         Demand demand_c = Demand(demand);
//         sender = offer_c.getOwner();
//         receiver = demand_c.getOwner();
//         Trader sender_c = Trader(sender);
//         Trader receiver_c = Trader(receiver);
//     }

//     function getUpdates () public view returns (mapping (int => int) ) {

//     }
// }