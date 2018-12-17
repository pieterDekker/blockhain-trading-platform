pragma solidity ^0.4.25;

import {Bids} from "bids.sol";

contract TradeAgreements {
    event NewTradeAgreement(uint id, address offerer, address demander);
    struct TradeAgreement {
        bytes ipfs_file_id;
    }

    Bids bidsContract;

    TradeAgreement[] private agreements;

    constructor (address bids) public {
        bidsContract = Bids(bids);
    }

    function create (uint offer, address offerer, uint demand, address demander, bytes ipfs_file_id) public {
        require(!bidsContract.isBidUsed(offer));
        require(!bidsContract.isBidUsed(demand));
        bidsContract.useBid(offer);
        bidsContract.useBid(demand);
        agreements.push(TradeAgreement({ipfs_file_id: ipfs_file_id}));
        emit NewTradeAgreement(agreements.length - 1, offerer, demander);
    }

    function getName() public pure returns (string) {
        return "TradeAgreements";
    }
}
