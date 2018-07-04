pragma solidity ^0.4.24;

/** Represents an abstract bid */
contract Bid {
    /** The creator and owner */
    address private owner;
    int private owner_set = 0;

    /** The volume to be traded in number of units */
    int private volume = 0;

    /** The price per unit offered/demanded in cents*/
    int private unit_price = 0;

    /** The time at which this bid stops being relevant */
    uint private expiration_time = 0;

    /** A list of accounts that the owner of this bid does not want to trade with for this bid */
    address[] private blacklist;

    /** A boolean indicating wether this bid is used in an agreement already */
    bool private used = false;

    function setOwner (address _owner) public {
        //Set owner only once ever
        require(owner_set == 0);
        owner = _owner;
    }

    function getOwner () public view returns (address _owner) {
        return owner;
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
    function setPricePerUnit (int _unit_price) public {
        require(msg.sender == owner);
        require(unit_price == 0);
        require(_unit_price > 0);
        unit_price = _unit_price;
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

    function setUsed () public {
        require(!used);
        used = true;
    }

    /**
        Allow the owner to add an address to the blacklist
     */
    function addToBlacklist (address _other_party) public {
        require(msg.sender == owner);
        blacklist.push(_other_party);
    }

    /**
        Returns the relevant details of this contract
     */
    function getDetails () public view returns (int _volume, int _unit_price, uint _expiration_time, bool _used) {
        return (volume, unit_price, expiration_time, _used);
    }
    //Following is for testing purposes

    string name = "bid";

    function setName(string _name) public {
        name = _name;
    }

    function getName() public view returns (string) {
        return name;
    }
}