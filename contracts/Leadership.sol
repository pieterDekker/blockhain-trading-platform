pragma solidity >=0.4.21 <0.7.0;
pragma experimental ABIEncoderV2;

contract Leadership {
    address private currentLeader = address(0);

    event NewLeader (address leader, uint ticket, uint minUsed, uint maxUsed, uint timeStampUsed, uint difficultyUsed);
    event TicketIssued(address trader);

    uint private min;
    uint private max;
    address[] private tickets;

    mapping (address => uint) private traderTicketAmount;

    bool private roundInSession;

    mapping (address => bool) private traderInitiated;

    constructor () public {
        min = 0;
        max = 0;
    }

    modifier inRange (uint ticket) {
        require(ticket >= min, "Ticket value out of range, too low");
        require(ticket < max, "Ticket value out of range, too high");
        _;
    }

    //TICKET CODE
    //todo: make this private/restricted to the leader or as a part of the leadership selection process
    //todo: make the whole thing more efficient by remembering where we last drew a ticket from, 
    //      that way, the only time a new slot needs to be allocated when a trader gets 
    function issueTicket (address trader) public {
        uint next = max;
        if (next == tickets.length) {
            tickets.push(trader);
        } else {
            tickets[next] = trader;
        }
        max++;
        traderTicketAmount[trader]++;
    }

    function issueTickets (address trader, uint amount) public {
        while (amount > 0) {
            issueTicket(trader);
            amount--;
        }
    }

    function removeTicket (uint ticket) public inRange(ticket) {
        traderTicketAmount[tickets[ticket]]--;
        tickets[ticket] = address(0);
        if (ticket == min) {
            uint idx = min;
            while (idx < tickets.length && tickets[idx] == address(0)) {
                idx = idx + 1;
            }
            min = idx;
        }
    }

    function draw () public {
        uint rand = random();
        while (tickets[rand] == address(0)) {
            rand++;
        }
        address winner = tickets[rand];
        removeTicket(rand);
        if (traderTicketAmount[winner] == 0) {
            issueTicket(winner);
        }
        currentLeader = winner;
        emit NewLeader(winner, rand, min, max, block.timestamp, block.difficulty);
    }

    function random () private view returns (uint) {
        return min + (uint(keccak256(abi.encodePacked(block.timestamp, block.difficulty))) % (max - min));
    }

    function getTicket (uint ticket) public inRange(ticket) view returns (address _owner) {
        return tickets[ticket];
    }

    function getTickets () public view returns (address[] memory) {
        return tickets;
    }

    function getTraderTicketAmount (address trader) public view returns (uint) {
        return traderTicketAmount[trader];
    }

    function getMin () public view returns (uint) {
        return min;
    }

    function getMax () public view returns (uint) {
        return max;
    }
    //END TICKET CODE

    //ROUND CODE
    function roundIsInSession() public view returns (bool) {
        return roundInSession;
    }

    //LEADER CODE
    function getCurrentLeader() public view returns (address) {
        return currentLeader;
    }
}
