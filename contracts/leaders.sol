pragma solidity ^0.4.25;

contract leaders {
    //Event for when a new trader is added to the leader list
    event LeaderIntroduction(address leader);
    //Last time a leader was added
    uint lastLeaderIntroduction;

    //Event for wen there is a new Leader
    event NewLeader(address leader);
    uint lastNewLeader;

    //All actual data on leaders
    address[] leaders;
    mapping (address => uint) miningValue;
    mapping (address => bool) traderIsLeader;
    address latestLeader;

    //Amount of transactions until next leader from start of new leader
    uint leaderFrequency;
    uint currentLeaderTransactionCap;

    constructor () public {
        leaderFrequency = 10; // TODO: change to something non-arbitrary
    }

    function introduceLeader (address trader) public {
        require(!traderIsLeader[trader]);
        traderIsLeader[trader] = true;
        miningValue[trader] = 0;
        leaders.push(trader);
        emit LeaderIntroduction(trader);
    }


    function currentLeader () public view returns (address) {
        return latestLeader;
    }

    function updateLeaderFrequency () public {

    }

    function getTransaction (address _leader) public view returns (uint) {

    }

    function leaderShouldUpdate () public view returns (bool) {

    }

    function updateLeader () public {
        //check who should be leader based on number of transactions in this session, miningValues, mean, standard deviation
        //look blocks back a is reached that was nog mined by current leader
        //if transactions >= leaderFrequency we should go to a new leader
        address newLeader;
        bool shouldUpdateLeader = false;

        //if should be new leader, update

        latestLeader = newLeader;
        emit NewLeader(newLeader);
    }
}
