pragma solidity ^0.4.24;

/** Represents an abstract bid */
contract Bid {
    /** The creator and owner */
    address private owner;
    int private owner_set = 0;

    /** The volume to be traded in number of units */
    int private volume = 0;

    /** The price per unit offered/demanded in cents*/
    int private price_per_unit = 0;

    /** The time at which this bid stops being relevant */
    uint private expiration_time = 0;

    /** A list of accounts that the owner of this bid does not want to trade with for this bid */
    address[] private blacklist;

    /** A constructor without implementation so this contract is abstract */
    // constructor () public payable {
        
    // }

    function setOwner (address _owner) public {
        //Set owner only once ever
        require(owner_set == 0);
        owner = _owner;
    }

    /**
        Allow only the owner to set the volume of this bid.
     */
    function setVolume (int _volume) public {
        require(msg.sender == owner);
        require(_volume > 0);
        volume = _volume;
    }

    /**
        Allow the owner to set the price per unit, only once.
     */
    function setPricePerUnit (int _price_per_unit) public {
        require(msg.sender == owner);
        require(price_per_unit == 0);
        require(_price_per_unit > 0);
        price_per_unit = _price_per_unit;
    }

    /**
        Allow the owner to set the expiration time, only once.
     */
    function setExpirationTime (uint _expiration_time) public {
        require(msg.sender == owner);
        require(expiration_time == 0);
        // require(_expiration_time > now);
        expiration_time = _expiration_time;
    }

    /**
        Allow the owner to add an address to the blacklist
     */
    function addToBlacklist (address _other_party) public {
        require(msg.sender == owner);
        blacklist.push(_other_party);
    }

    //Following is for testing purposes

    /*
        Test the reachability
    */
    function testReachability () public pure returns (string _) {
        return "Hey hey hey heeeeeeey! wassa wassa wassa wassuuuuuup! bitconneeeeeeeeeeeee";
    }

    string name = "bid";
    function setName(string _name) public {
        name = _name;
    }

    function getName() public view returns (string _) {
        return name;
    }
}