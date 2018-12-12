pragma solidity ^0.4.25;

contract Lottery {
    event NewLeader(address leader, uint ticket, uint minUsed, uint maxUsed, uint timeStampUsed, uint difficultyUsed);

    uint private min;
    uint private max;
    address[] tickets;

    mapping (address => uint) traderTicketAmount;

    constructor () public {
        min = 0;
        max = 0;
    }

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
            uint next = max;
            if (next == tickets.length) {
                tickets.push(trader);
            } else {
                tickets[next] = trader;
            }
            max++;
            traderTicketAmount[trader]++;
            amount--;
        }
    }

    function removeTicket(uint ticket) public {
        require(ticket >= min);
        require(ticket < max);
        traderTicketAmount[tickets[ticket]]--;
        tickets[ticket] = address(0);
        if (ticket == min) {
            uint idx = min;
            while (tickets[idx] == address(0)) {
                idx++;
            }
            min = idx;
        }
    }

    function draw() public {
        uint rand = random();
        while (tickets[rand] == address(0)) {
            rand++;
        }
        address winner = tickets[rand];
        removeTicket(rand);
        if (traderTicketAmount[winner] == 0) {
            issueTicket(winner);
        }
        emit NewLeader(winner, rand, min, max, block.timestamp, block.difficulty);
    }

    function random() private view returns (uint) {
        return min + (uint(keccak256(abi.encodePacked(block.timestamp, block.difficulty))) % (max - min));
    }

    function getTickets () public view returns(address[]) {
        return tickets;
    }

    function getTicket (uint ticket) public view returns (address) {
        require(ticket >= min);
        require(ticket < max);
        return tickets[ticket];
    }

    function getTraderTicketAmount(address trader) public view returns (uint) {
        return traderTicketAmount[trader];
    }

    function getName() public pure returns(string) {
        return "Tickets";
    }

    function getMin () public view returns (uint) {
        return min;
    }

    function getMax () public view returns (uint) {
        return max;
    }
}
