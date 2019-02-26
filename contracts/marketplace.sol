pragma solidity ^0.4.25;
pragma experimental ABIEncoderV2;

contract Bids {
    event NewBid(uint index);
    event NewBids(uint[] indices);

    event RoundRecorded(uint id, bytes ipfs_file);

    bytes[] private _bids;
    uint private current_bids_amount = 0;
    uint private bids_cap;

    bytes[] private rounds;

    function getName() public pure returns (string) {
        return "Bids";
    }

    function newBid(bytes _ipfs_file_id) public {
        if (current_bids_amount == _bids.length) {
            _bids.push(_ipfs_file_id);
        } else {
            _bids[current_bids_amount] = _ipfs_file_id;
        }
        emit NewBid(current_bids_amount);
        current_bids_amount++;
    }

    function newBids(bytes[] _ipfs_file_ids) public {
        uint[] memory indices = new uint[](_ipfs_file_ids.length);
        for (uint i = 0; i < _ipfs_file_ids.length; ++i) {
            if (current_bids_amount == _bids.length) {
                _bids.push(_ipfs_file_ids[i]);
            } else {
                _bids[current_bids_amount] = _ipfs_file_ids[i];
            }
            indices[i] = current_bids_amount;
            current_bids_amount++;
        }
        emit NewBids(indices);
    }

    function getBid(uint id) public view returns (bytes ipfs_file_id) {
        return _bids[id];
    }

    function getBids() public view returns (bytes[]) {
        return _bids;
    }

    function recordRound(bytes round_record_ipfs_file) public {
        rounds.push(round_record_ipfs_file);
        current_bids_amount = 0;
        emit RoundRecorded(rounds.length - 1, round_record_ipfs_file);
    }

    function getRound(uint id) public view returns (bytes ipfs_file_id) {
        return rounds[id];
    }

// vvvvvvvvvvvvvvvv New interface vvvvvvvvvvvvvvvv

    event NewOffer(uint index);
    event NewDemand(uint index);

    bytes[] private _offers;
    bytes[] private _demands;
    uint private current_offers_amount = 0;
    uint private current_demands_amount = 0;
    uint private offers_cap;
    uint private demands_cap;

    address leadership;

    function publishOffer(bytes _ipfs_file_id) public {
        if (current_offers_amount == _offers.length) {
            _offers.push(_ipfs_file_id);
        } else {
            _offers[current_offers_amount] = _ipfs_file_id;
        }
        emit NewBid(current_offers_amount);
        current_offers_amount++;
    }

    function publishDemand(bytes _ipfs_file_id) public {
        if (current_demands_amount == _demands.length) {
            _demands.push(_ipfs_file_id);
        } else {
            _demands[current_demands_amount] = _ipfs_file_id;
        }
        emit NewBid(current_demands_amount);
        current_demands_amount++;
    }

    function publishOffers(bytes[] _ipfs_file_ids) public {
        for (uint i = 0; i < _ipfs_file_ids.length; i++) {
            publishOffer(_ipfs_file_ids[i]);
        }
    }

    function publishDemands(bytes[] _ipfs_file_ids) public {
        for (uint i = 0; i < _ipfs_file_ids.length; i++) {
            publishDemand(_ipfs_file_ids[i]);
        }
    }

    function getOffer(uint id) public view returns (bytes ipfs_file_id) {
        return _offers[id];
    }

    function getDemand(uint id) public view returns (bytes ipfs_file_id) {
        return _demands[id];
    }
}


