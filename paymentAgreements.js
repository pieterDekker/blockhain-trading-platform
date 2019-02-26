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
	if (!initialized) throw new Error("PaymentAgreements utilities used before initialized");
}

function newPaymentAgreementObject(
	_offerOwner,
	_offerPath,
	_demandOwner,
	_demandPath,
	_amountGoal,
	_amountActual,
	_amountClaimed,
	_unitPrice,
	_expires,
	_finished
) {
	return {
		offerOwner: _offerOwner,
		offerPath: _offerPath,
		demandOwner: _demandOwner,
		demandPath: _demandPath,
		amountGoal: _amountGoal,
		amountActual: _amountActual,
		amountClaimed: _amountClaimed,
		unitPrice: _unitPrice,
		expires: _expires,
		finished: _finished
	}
}

async function get(contract, index) {
	checkInitialized();
	let rawObj = await contract.methods.get(index).call();
	return newPaymentAgreementObject(
		rawObj.offerOwner,
		byteUtils.byteStringToString(rawObj.offerPath),
		rawObj.demandOwner,
		byteUtils.byteStringToString(rawObj.demandPath),
		Number(rawObj.amountGoal),
		Number(rawObj.amountActual),
		Number(rawObj.amountClaimed),
		Number(rawObj.unitPrice),
		Number(rawObj.expires),
		rawObj.finished
	);
}

async function claimAmount(contract, index, amount) {
	checkInitialized();
	let receipt = await contract.methods.claimAmount(index, amount).send({from: account, gas: gasAmount});
	return receipt;
}

async function confirmAmount(contract, index) {
	checkInitialized();
	let receipt = await contract.methods.confirmAmount(index).send({from: account, gas: gasAmount});
	return receipt;
}

module.exports = {
	init: init,
	newPaymentAgreementObject: newPaymentAgreementObject,
	get: get,
	claimAmount: claimAmount,
	confirmAmount: confirmAmount
};