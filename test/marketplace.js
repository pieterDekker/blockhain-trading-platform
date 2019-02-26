const util = require('../test_util');
const marketplace = require('../marketplace'); //The marketplace component

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
	marketplace.init(account, gasAmount);
}

/**
 * @param {Eth.Contract} contract
 */
async function testGetName(contract) {
	let fn = "getName";
	expect_f(fileName, fn, 1);
	let name = await contract.methods.getName().call();
	assertTrue(name === "Bids", fn, "Name should be \"Bids\"");
}

async function testNewBid(contract) {
	let fn = "newBid";
	expect_f(fileName, fn, 4);

	/** @type {Bid} */
	let bid = marketplace.newBidObject(0, 1, 2, 3, account);

	try {
		let index = await marketplace.publishBid(contract, bid);
		let retrieved_bid = await marketplace.getBid(contract, index);
		assertTrue(retrieved_bid.type === bid.type, fn, "retrieved bid type should be " + bid.type + ", is " + retrieved_bid.type);
		assertTrue(retrieved_bid.unit_price === bid.unit_price, fn, "retrieved bid unit price should be " + bid.unit_price + ", is " + retrieved_bid.unit_price);
		assertTrue(retrieved_bid.volume === bid.volume, fn, "retrieved bid volume should be " + bid.volume + ", is " + retrieved_bid.volume);
		assertTrue(retrieved_bid.expires === bid.expires, fn, "retrieved bid expires should be " + bid.expires + ", is " + retrieved_bid.expires);
	} catch (error) {
		console.log(error);
		error_f(fileName, fn, error);
	}
}

async function testNewBids(contract) {
	let fn = "newBids";
	expect_f(fileName, fn, 1);

	/** @type {Bid} */
	let bids = [
		marketplace.newBidObject(0, 1, 2, 3, account),
		marketplace.newBidObject(0, 1, 2, 3, account),
		marketplace.newBidObject(0, 1, 2, 3, account),
	];

	try {
		let indices = await marketplace.publishBids(contract, bids);
		assertTrue(indices.length === 3, fn, "Expected 3 indices, got " + indices.length);
	} catch (error) {
		console.log(error);
		error_f(fileName, fn, error);
	}
}

async function testGetBids(contract) {
	let fn = "getBids";
	expect_f(fileName, fn, 1);

	/** @type {Bid[]} */
	let bids =
		[
			marketplace.newBidObject(0, 1, 2, 3, account),
			marketplace.newBidObject(1, 4, 5, 6, account),
			marketplace.newBidObject(0, 7, 8, 9, account)
		];

	await marketplace.publishBids(contract, bids);

	let retrievedBids = await marketplace.getBids(contract);
	// console.log(retrievedBids);
	pass_f(fileName, fn, "getBids returned succesfully");
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
	testGetName: testGetName,
	testNewBid: testNewBid,
	testNewBids: testNewBids,
	testGetBids: testGetBids,
};