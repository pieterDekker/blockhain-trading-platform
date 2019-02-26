pragma solidity ^0.4.25;
pragma experimental ABIEncoderV2;

import {TradeAgreements} from "tradeAgreements.sol";

contract Matches {

    event NewMatch(uint index, address offerOwner, address demandOwner);

    struct Match {
        address offerOwner;
        bytes offerPath;
        bool offerOwnerAccepted;
        address demandOwner;
        bytes demandPath;
        bool demandOwnerAccepted;
        uint volume;
        uint unitPrice;
        uint expires;
        bool agreementCreated;
    }

    TradeAgreements tradeAgreements;

    Match[] private _matches;
    uint private current_matches_amount = 0;

    constructor (address _tradeAgreements) public {
        tradeAgreements = TradeAgreements(_tradeAgreements);
    }

    function publish(
        address _offerOwner,
        bytes _offerPath,
        address _demandOwner,
        bytes _demandPath,
        uint _volume,
        uint _unitPrice,
        uint _expires
    ) public {
        if (current_matches_amount == _matches.length) {
            Match memory m = Match({
                offerOwner: _offerOwner,
                offerPath: _offerPath,
                offerOwnerAccepted: false,
                demandOwner: _demandOwner,
                demandPath: _demandPath,
                demandOwnerAccepted: false,
                volume: _volume,
                unitPrice: _unitPrice,
                expires: _expires,
                agreementCreated: false
            });
            _matches.push(m);
        } else {
            _matches[current_matches_amount].offerOwner = _offerOwner;
            _matches[current_matches_amount].offerPath = _offerPath;
            _matches[current_matches_amount].offerOwnerAccepted = false;
            _matches[current_matches_amount].demandOwner = _demandOwner;
            _matches[current_matches_amount].demandPath = _demandPath;
            _matches[current_matches_amount].demandOwnerAccepted = false;
            _matches[current_matches_amount].volume = _volume;
            _matches[current_matches_amount].unitPrice= _unitPrice;
            _matches[current_matches_amount].expires = _expires;
            _matches[current_matches_amount].agreementCreated = false;
        }
        emit NewMatch(current_matches_amount, _offerOwner, _demandOwner);
        current_matches_amount++;
    }

    function get(uint index) public view returns (Match) {
        return _matches[index];
    }

    function acceptOffer(uint index) public {
        require(msg.sender == _matches[index].demandOwner);
        _matches[index].demandOwnerAccepted = true;
        if (_matches[index].offerOwnerAccepted) {
            createAgreement(index);
        }
    }

    function acceptDemand(uint index) public {
        require(msg.sender == _matches[index].offerOwner);
        _matches[index].offerOwnerAccepted = true;
        if (_matches[index].demandOwnerAccepted) {
            createAgreement(index);
        }
    }

    function createAgreement(uint index) private {
        require(_matches[index].demandOwnerAccepted);
        require(_matches[index].offerOwnerAccepted);
        require(!(_matches[index].agreementCreated));
        Match storage m = _matches[index];
        tradeAgreements.create(
            m.offerOwner,
            m.offerPath,
            m.demandOwner,
            m.demandPath,
            m.volume,
            m.unitPrice,
            m.expires
        );
        _matches[index].agreementCreated = true;
    }
}
