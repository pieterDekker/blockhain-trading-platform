pragma solidity ^0.4.25;
pragma experimental ABIEncoderV2;

contract PaymentAgreements {
    event NewPaymentAgreement(uint index, address offerOwner, address demandOwner);

    struct PaymentAgreement {
        address offerOwner;
        bytes offerPath;
        address demandOwner;
        bytes demandPath;
        uint amountGoal;
        uint amountActual;
        uint amountClaimed;
        uint expires;
        bool finished;
    }

    PaymentAgreement[] private agreements;
    mapping (address => uint[]) agreementsPerTrader;

    constructor () public {
    }

    function create(
        address _offerOwner,
        bytes _offerPath,
        address _demandOwner,
        bytes _demandPath,
        uint _amount,
        uint _expires
    ) public {
        agreements.push(
            PaymentAgreement(
                {
                offerOwner: _offerOwner,
                offerPath: _offerPath,
                demandOwner: _demandOwner,
                demandPath: _demandPath,
                amountGoal: _amount,
                amountActual: 0,
                amountClaimed: 0,
                expires: _expires,
                finished: false
                }
            )
        );
        emit NewPaymentAgreement(agreements.length - 1, _offerOwner, _demandOwner);
    }

    function get(uint id) public view returns (PaymentAgreement) {
        return agreements[id];
    }

    function getName() public pure returns (string) {
        return "PaymentAgreements";
    }

    function claimAmount(uint index, uint _amountClaimed) public {
        require(msg.sender == agreements[index].demandOwner);
        agreements[index].amountClaimed = _amountClaimed;
    }

    function confirmAmount(uint index) public {
        require(msg.sender == agreements[index].offerOwner);
        agreements[index].amountActual = agreements[index].amountClaimed;
        if (agreements[index].amountActual >= agreements[index].amountGoal) {
            agreements[index].finished = true;
        }
    }
}
