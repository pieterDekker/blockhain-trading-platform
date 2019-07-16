const Web3 = require('web3');
const kp = require('keypair');
const testUtil = require('../test_util');
const fs = require('fs');
const nodeUtil = require('../node_utils');
const node = nodeUtil.getNode();

let fileName = 'marketplace.sol';

let includes = [];

let constructor_arguments = [];

let account = "";

let gasAmount;

/**
 * @type expectCallback
 * @callback expectCallback
 * @param {String} fileName
 * @param {String} functionName
 * @param {Number} num_assertions
 */
let expect_f = undefined;

/**
 * @type failCallback
 * @callback failCallback
 * @param {String} fileName
 * @param {String} functionName
 * @param {String} Message
 */
let fail_f = undefined;

/**
 * @type passCallback
 * @callback passCallback
 * @param {String} fileName
 * @param {String} functionName
 * @param {String} message
 */
let pass_f = undefined;

/**
 * @type errorCallback
 * @callback errorCallback
 * @param {String} fileName
 * @param {String} functionName
 * @param {Object} error
 */
let error_f = undefined;

/**
 *
 * @param {boolean} cond
 * @param {String} function_name
 * @param {String} message
 */
function assertTrue(cond, function_name, message) {
	if (cond) {
		pass_f(fileName, function_name, message);
	} else {
		fail_f(fileName, function_name, message);
	}
}

/**
 * Set the account address to be used in transactions
 *
 * @param {String} _account
 */
function setAccount (_account) {
	account = _account;
}

/**
 * Set the maximum gas amount to be used in transactions
 *
 * @param {Number} _gasAmount
 */
function setGasAmount(_gasAmount) {
	gasAmount = _gasAmount;
}

/**
 * Set the expect callback to the appropriate function
 * @param {expectCallback} callback
 */
function setExpect(callback) {
	expect_f = callback;
}

/**
 * Set the fail callback to the appropriate function
 * @param {failCallback} callback
 */
function setFail(callback) {
	fail_f = callback;
}

/**
 * Set the pass callback to the appropriate function
 * @param {passCallback} callback
 */
function setPass(callback) {
	pass_f = callback;
}

/**
 * Set the error callback to the appropriate function
 * @param {errorCallback} callback
 */
function setError(callback) {
	error_f = callback;
}

/**
 * Initialize this test module.
 *
 * @param _account
 * @param _gasAmount
 * @param _expect_f
 * @param _pass_f
 * @param _fail_f
 * @param _error_f
 */
function init(_account, _gasAmount, _expect_f, _pass_f, _fail_f, _error_f) {
	setAccount(_account);
	setGasAmount(_gasAmount);
	setExpect(_expect_f);
	setPass(_pass_f);
	setFail(_fail_f);
	setError(_error_f);
}

// async function compileAndDeployContract(account, gasAmount) {
//
// }

async function testNewBid(contract) {
	let fn = "newBid";
	expect_f(fileName, fn, 1);

	const ipfs = require('../ipfs_util');
	let ipfs_node = await ipfs.getNode();

	let keyPair = {};
	try {
		keyPair.public = ipfs.getPublicKey();
		keyPair.private = ipfs.getPrivateKey();
	} catch (e) {
		keyPair = kp();
		ipfs.addPublicKey(account, keyPair.public);
		ipfs.setPrivateKey(keyPair.private)
	}


	let calls = 1000;
	for (let i = 0; i < calls; ++i) {
		/** @type {Bid} */
		let bid = {
			type : Math.random() > 0.5 ? 1 : 0,
			unit_price : Math.floor(Math.random() * 10000),
			volume: Math.floor(Math.random() * 10000),
			expires: Math.floor(Math.random() * 10000),
			owner: account
		};
		let ipfsPathIn = await ipfs.storeBid(ipfs_node, bid, keyPair.private);
		let ipfsPathBytesIn = testUtil.stringToBytes(ipfsPathIn.path);
		contract.methods.newBid(ipfsPathBytesIn).send({from: account, gas: gasAmount});
	}
	pass_f(fileName, fn, "Made " + calls + " calls");
}

module.exports = {
	constructor_arguments: constructor_arguments,
	fileName: fileName,
	includes: includes,
	setFail: setFail,
	setPass: setPass,
	setExpect: setExpect,
	setError: setError,
	setAccount: setAccount,
	setGasAmount: setGasAmount,
	init: init,
	// compileAndDeployContract: compileAndDeployContract
	testNewBid: testNewBid
};