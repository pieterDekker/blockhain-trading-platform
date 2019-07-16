const ipfsUtils = require('./ipfs_util');
const byteUtils = require('./byte_utils');
let initialized = false;

let account = "";
let gasAmount = 0;
let keyPair = {private: null, public: null};

function init(_account, _gasAmount) {
	account = _account;
	gasAmount = _gasAmount;
	keyPair = ipfsUtils.getKeyPair(account);
	initialized = true;
}

function checkInitialized() {
	if (!initialized) throw new Error("Bids utilities used before initialized");
}

function newMatchObject(
	_offerOwner,
	_offerPath,
	_demandOwner,
	_demandPath,
	_volume,
	_unitPrice,
	_expires,
	_offerOwnerAccepted = false,
	_demandOwnerAccepted = false,
	_agreementCreated = false
) {
	return {
		offerOwner: _offerOwner,
		offerPath: _offerPath,
		offerOwnerAccepted: _offerOwnerAccepted,
		demandOwner: _demandOwner,
		demandPath: _demandPath,
		demandOwnerAccepted: _demandOwnerAccepted,
		volume: _volume,
		unitPrice: _unitPrice,
		expires: _expires,
		agreementCreated: _agreementCreated
	}
}

function matchesAreEqual(matchA, matchB) {
	if (matchA.offerOwner !== matchB.offerOwner) return false;
	if (matchA.offerPath !== matchB.offerPath) return false;
	if (matchA.demandOwner !== matchB.demandOwner) return false;
	if (matchA.demandPath !== matchB.demandPath) return false;
	if (matchA.volume !== matchB.volume) return false;
	if (matchA.unitPrice !== matchB.unitPrice) return false;
	return matchA.expires === matchB.expires;
}

async function publish(contract, obj) {
	checkInitialized();
	let receipt = await contract.methods.publish(
		obj.offerOwner,
		byteUtils.stringToBytes(obj.offerPath),
		obj.demandOwner,
		byteUtils.stringToBytes(obj.demandPath),
		obj.volume,
		obj.unitPrice,
		obj.expires
	).send({from: account, gas: gasAmount});
	return receipt.events.NewMatch.returnValues.index;
}

async function get(contract, index) {
	checkInitialized();
	let retrieved = await contract.methods.get(index).call();
	return newMatchObject(
		retrieved.offerOwner,
		byteUtils.byteStringToString(retrieved.offerPath),
		retrieved.demandOwner,
		byteUtils.byteStringToString(retrieved.demandPath),
		Number(retrieved.volume),
		Number(retrieved.unitPrice),
		Number(retrieved.expires),
		retrieved.offerOwnerAccepted,
		retrieved.demandOwnerAccepted,
		retrieved.agreementCreated
	);
}

async function acceptOffer(contract, index) {
	checkInitialized();
	let receipt = await contract.methods.acceptOffer(index).send({from: account, gas: gasAmount});
	return receipt;
}

async function acceptDemand(contract, index) {
	checkInitialized();
	let receipt = await contract.methods.acceptDemand(index).send({from: account, gas: gasAmount});
	return receipt;
}

module.exports = {
	init: init,
	newMatchObject: newMatchObject,
	matchesAreEqual: matchesAreEqual,
	publish: publish,
	get: get,
	acceptOffer: acceptOffer,
	acceptDemand: acceptDemand
};