pragma solidity ^0.4.25;

contract bids {
    event NewBid(uint index);
    
    address private launcher;

    struct Bid {
        bytes ipfs_file_id;
        bytes32 content_hash;
    }

    Bid[] private _bids;

    constructor () public {
        launcher = msg.sender;
    }

    function getLauncher() public view returns (address) {
        return launcher;
    }

    function getName() public pure returns (string) {
        return "Bids";
    }

    function newBid(bytes _ipfs_file_id, uint _type, uint _unit_price, uint _volume, uint _exp) public returns (uint) {
        uint id = _bids.length;
        bytes32 content_hash = keccak256(abi.encodePacked(msg.sender, _type, _unit_price, _volume, _exp, id));
        _bids.push(Bid({ipfs_file_id: _ipfs_file_id, content_hash: content_hash}));
        emit NewBid(id);
    }

    function getBid(uint id) public view returns (bytes ipfs_file_id, bytes32 content_hash) {
        Bid storage b = _bids[id];
        ipfs_file_id = b.ipfs_file_id;
        content_hash = b.content_hash;
    }
}


