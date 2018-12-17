pragma solidity ^0.4.25;

contract Bids {
    event NewBid(uint index);

    struct Bid {
        bytes ipfs_file_id;
    }

    Bid[] private _bids;
    uint[] private usedBids;
    mapping (uint => bool) bidUsed;

    constructor () public {}

    function getName() public pure returns (string) {
        return "Bids";
    }

    function newBid(bytes _ipfs_file_id) public {
        uint id = _bids.length;
        _bids.push(Bid({ipfs_file_id: _ipfs_file_id}));
        emit NewBid(id);
    }

    function getBid(uint id) public view returns (bytes ipfs_file_id) {
        Bid storage b = _bids[id];
        ipfs_file_id = b.ipfs_file_id;
    }

    function useBid(uint id) public {
        usedBids.push(id);
        bidUsed[id] = true;
    }

    function isBidUsed(uint id) public view returns (bool) {
        return bidUsed[id];
    }

    function getUsedBids() public view returns (uint[]) {
        return usedBids;
    }
}


