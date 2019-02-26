pragma solidity ^0.4.25;
pragma experimental ABIEncoderV2;

import {PaymentAgreements} from "paymentAgreements.sol";

contract TradeAgreements {
    event NewTradeAgreement(uint index, address offerOwner, address demandOwner);
    event VolumeClaimed(uint index, address offerOwner, address demandOwner);
    event VolumeConfirmed(uint index, address offerOwner, address demandOwner);

    struct TradeAgreement {
        address offerOwner;
        bytes offerPath;
        address demandOwner;
        bytes demandPath;
        uint volumeGoal;
        uint volumeActual;
        uint volumeClaimed;
        uint unitPrice;
        uint expires;
        bool agreementCreated;
    }

    TradeAgreement[] private agreements;
    mapping (address => uint[]) agreementsPerTrader;

    address private matches;
    PaymentAgreements private paymentAgreements;

    constructor (
//        address _matches,
        address _paymentAgreements
    ) public {
//        matches = _matches;
        paymentAgreements = PaymentAgreements(_paymentAgreements);
    }

    function create(
        address _offerOwner,
        bytes _offerPath,
        address _demandOwner,
        bytes _demandPath,
        uint _volume,
        uint _unitPrice,
        uint _expires
    ) public {
//        require(msg.sender == matches, "Sender must be Matches contract");
        agreements.push(
            TradeAgreement(
                {
                offerOwner: _offerOwner,
                offerPath: _offerPath,
                demandOwner: _demandOwner,
                demandPath: _demandPath,
                volumeGoal: _volume,
                volumeActual: 0,
                volumeClaimed: 0,
                unitPrice: _unitPrice,
                expires: _expires,
                agreementCreated: false
                }
            )
        );
        emit NewTradeAgreement(agreements.length - 1, _offerOwner, _demandOwner);
    }

    function get(uint id) public view returns (TradeAgreement) {
        return agreements[id];
    }

    function getName() public pure returns (string) {
        return "TradeAgreements";
    }

    function claimVolume(uint index, uint _volumeClaimed) public {
        require(msg.sender == agreements[index].offerOwner);
        agreements[index].volumeClaimed = _volumeClaimed;
        emit VolumeClaimed(index, agreements[index].offerOwner, agreements[index].demandOwner);
    }

    function confirmVolume(uint index) public {
        TradeAgreement storage agreement = agreements[index];
        require(msg.sender == agreement.demandOwner);
        agreement.volumeActual = agreement.volumeClaimed;
        emit VolumeConfirmed(index, agreements[index].offerOwner, agreements[index].demandOwner);
        if (agreement.volumeActual >= agreement.volumeGoal) {
            paymentAgreements.create(
                agreement.offerOwner,
                agreement.offerPath,
                agreement.demandOwner,
                agreement.demandPath,
                agreement.volumeGoal * agreement.unitPrice,
                agreement.expires
            );
            agreement.agreementCreated = true;
        }
    }
}
