const web3Utils = require('web3').utils;

function applyChecksum(address) {
	for (let c of address) {
		if (isNaN(c) && c === c.toUpperCase()) {
			return address;
		}
	}
	let hash = web3Utils.sha3(address.substr(2, address.length - 2));
	let checksummedAddress = "0x";

	for (let i = 2; i < address.length; ++i) {
		if (hash[i] <= 7) {
			checksummedAddress += (address[i]).toLowerCase()
		} else {
			checksummedAddress += (address[i]).toUpperCase()
		}
	}
	return checksummedAddress;
}

module.exports = {
	applyChecksum: applyChecksum
};
