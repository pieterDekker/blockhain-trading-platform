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
	if (!initialized) throw new Error("TradeAgreements utilities used before initialized");
}

function newTradeAgreementObject(
	_offerOwner,
	_offerPath,
	_demandOwner,
	_demandPath,
	_volumeGoal,
	_volumeActual,
	_volumeClaimed,
	_unitPrice,
	_expires,
	_agreementCreated
) {
	return {
		offerOwner: _offerOwner,
		offerPath: _offerPath,
		demandOwner: _demandOwner,
		demandPath: _demandPath,
		volumeGoal: _volumeGoal,
		volumeActual: _volumeActual,
		volumeClaimed: _volumeClaimed,
		unitPrice: _unitPrice,
		expires: _expires,
		agreementCreated: _agreementCreated
	}
}

async function get(contract, index) {
	checkInitialized();
	let rawObj = await contract.methods.get(index).call();
	return newTradeAgreementObject(
		rawObj.offerOwner,
		byteUtils.byteStringToString(rawObj.offerPath),
		rawObj.demandOwner,
		byteUtils.byteStringToString(rawObj.demandPath),
		Number(rawObj.volumeGoal),
		Number(rawObj.volumeActual),
		Number(rawObj.volumeClaimed),
		Number(rawObj.unitPrice),
		Number(rawObj.expires),
		rawObj.agreementCreated
	);
}

async function claimVolume(contract, index, volume) {
	checkInitialized();
	let receipt = await contract.methods.claimVolume(index, volume).send({from: account, gas: gasAmount});
	return receipt;
}

async function confirmVolume(contract, index) {
	checkInitialized();
	let receipt = await contract.methods.confirmVolume(index).send({from: account, gas: gasAmount});
	return receipt;
}

module.exports = {
	init: init,
	newTradeAgreementObject: newTradeAgreementObject,
	get: get,
	claimVolume: claimVolume,
	confirmVolume: confirmVolume
};