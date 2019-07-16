const kp = require('keypair');
const testUtil = require('../test_util');
const nodeUtils = require('../node_utils');
const matchUtils = require('../matchmaking_utils');
const match = require('../Matchmaking');
const marketplace = require('../marketplace');
const tradeAgreements = require('../tradeAgreements');
const paymentAgreements = require('../paymentAgreements');
const eventUtils = require('../event_utils');
const byteUtils = require('../byte_utils');

const fs = require('fs');

let node = nodeUtils.getNode();

let fileName = 'paymentAgreements.sol';

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
	tradeAgreements.init(account, gasAmount);
	paymentAgreements.init(account, gasAmount);
}

async function compileAndDeployContract(account, gasAmount) {
	let marketplaceFile = fs.readFileSync('/home/pieter/bscinf/y3/bproject/docker/chain/contracts/marketplace.sol').toString();
	let marketplaceCompiled = testUtil.compileContractFromFile(marketplaceFile);
	let marketplaceContract =
		await (new node.eth.Contract(marketplaceCompiled.abi))
			.deploy({data: marketplaceCompiled.bytecode})
			.send({from: account, gas: gasAmount});

	let paymentAgreementsFile = fs.readFileSync('/home/pieter/bscinf/y3/bproject/docker/chain/contracts/paymentAgreements.sol').toString();
	let paymentAgreementsCompiled = testUtil.compileContractFromFile(paymentAgreementsFile);
	let paymentAgreementsContract =
		await (new node.eth.Contract(paymentAgreementsCompiled.abi))
			.deploy({data: paymentAgreementsCompiled.bytecode})
			.send({from: account, gas: gasAmount});

	let tradeAgreementsFile = fs.readFileSync('/home/pieter/bscinf/y3/bproject/docker/chain/contracts/tradeAgreements.sol').toString();
	// let tradeAgreementsCompiled = testUtil.compileContractFromFile(tradeAgreementsFile );
	let tradeAgreementsCompiled = testUtil.compileContractFromFileWithIncludes({'tradeAgreements.sol': tradeAgreementsFile}, {'paymentAgreements.sol': paymentAgreementsFile});
	let tradeAgreementsContract =
		await (new node.eth.Contract(tradeAgreementsCompiled.abi))
		// .deploy({data: tradeAgreementsCompiled.bytecode, arguments: ["0x0000000000000000000000000000000000000000"]})
		// .deploy({data: tradeAgreementsCompiled.bytecode, arguments: ["0x47681d90A3B1B044980c39ed1e32D160a8043Ceb"]})
			.deploy({data: tradeAgreementsCompiled.bytecode, arguments: [paymentAgreementsContract._address]})
			.send({from: account, gas: gasAmount});

	return {
		paymentAgreements: paymentAgreementsContract,
		tradeAgreements: tradeAgreementsContract,
		marketplace: marketplaceContract
	};
}

/**
 * @param {Eth.Contract} contracts
 */
async function testGetName(contracts) {
	let fn = "getName";
	expect_f(fileName, fn, 1);
	let name = await contracts.tradeAgreements.methods.getName().call();
	assertTrue(name === "TradeAgreements", fn, "Name should be TradeAgreements, is " + name);
}

async function testGet(contracts) {
	let fn = "get";
	expect_f(fileName, fn, 8);

	let offer = marketplace.newBidObject(0,1,2,3, account);
	let offerIndex = await marketplace.publishBid(contracts.marketplace, offer);
	let offerPath = await marketplace.getBidPath(contracts.marketplace, offerIndex);

	let demand = marketplace.newBidObject(1,1,2,3, account);
	let demandIndex = await marketplace.publishBid(contracts.marketplace, demand);
	let demandPath = await marketplace.getBidPath(contracts.marketplace, demandIndex);

	let createReceipt = await contracts.paymentAgreements.methods.create(account, byteUtils.stringToBytes(offerPath), account, byteUtils.stringToBytes(demandPath), 2, 3).send({from: account, gas: gasAmount});
	let createEventData = eventUtils.dataFromReceipt(createReceipt, "NewPaymentAgreement");

	let retrieved = await paymentAgreements.get(contracts.paymentAgreements, createEventData.id);

	assertTrue(retrieved.offerOwner === account, fn, "Expected offer owner to be " + account + " found " + retrieved.offerOwner);
	assertTrue(retrieved.demandOwner === account, fn, "Expected demand owner to be " + account + " found " + retrieved.demandOwner);
	assertTrue(retrieved.offerPath === offerPath, fn, "Expected offer path to be " + offerPath + " found " + retrieved.offerPath);
	assertTrue(retrieved.demandPath === demandPath, fn, "Expected demand path to be " + demandPath + " found " + retrieved.demandPath);
	assertTrue(retrieved.amountGoal === 2, fn, "Expected amount goal to be " + 2 + " found " + retrieved.amountGoal);
	assertTrue(retrieved.amountActual === 0, fn, "Expected amount actual to be " + 0 + " found " + retrieved.amountActual);
	assertTrue(retrieved.amountClaimed === 0, fn, "Expected amount claimed to be " + 0 + " found " + retrieved.amountClaimed);
	assertTrue(retrieved.finished === false, fn, "Expected finished to be false, found " + retrieved.finished);
}

async function testClaimAmount(contracts) {
	let fn = "claimAmount";
	expect_f(fileName, fn, 1);

	let offer = marketplace.newBidObject(0,1,2,3, account);
	let offerIndex = await marketplace.publishBid(contracts.marketplace, offer);
	let offerPath = await marketplace.getBidPath(contracts.marketplace, offerIndex);

	let demand = marketplace.newBidObject(1,1,2,3, account);
	let demandIndex = await marketplace.publishBid(contracts.marketplace, demand);
	let demandPath = await marketplace.getBidPath(contracts.marketplace, demandIndex);

	let createReceipt = await contracts.paymentAgreements.methods.create(account, byteUtils.stringToBytes(offerPath), account, byteUtils.stringToBytes(demandPath), 2, 3).send({from: account, gas: gasAmount});
	let createEventData = eventUtils.dataFromReceipt(createReceipt, "NewPaymentAgreement");

	let claimAmount = 2;
	await paymentAgreements.claimAmount(contracts.paymentAgreements, createEventData.id, claimAmount);
	let retrieved = await paymentAgreements.get(contracts.paymentAgreements, createEventData.id);

	assertTrue(retrieved.amountClaimed === claimAmount, fn, "Expected amount claimed to be " + claimAmount + " found " + retrieved.amountClaimed);
}

async function testConfirmAmount(contracts) {
	let fn = "confirmAmount";
	expect_f(fileName, fn, 2);

	let offer = marketplace.newBidObject(0,1,2,3, account);
	let offerIndex = await marketplace.publishBid(contracts.marketplace, offer);
	let offerPath = await marketplace.getBidPath(contracts.marketplace, offerIndex);

	let demand = marketplace.newBidObject(1,1,2,3, account);
	let demandIndex = await marketplace.publishBid(contracts.marketplace, demand);
	let demandPath = await marketplace.getBidPath(contracts.marketplace, demandIndex);

	let createReceipt = await contracts.paymentAgreements.methods.create(account, byteUtils.stringToBytes(offerPath), account, byteUtils.stringToBytes(demandPath), 2, 3).send({from: account, gas: gasAmount});
	let createEventData = eventUtils.dataFromReceipt(createReceipt, "NewPaymentAgreement");

	let claimAmount = 2;
	await paymentAgreements.claimAmount(contracts.paymentAgreements, createEventData.id, claimAmount);
	await paymentAgreements.confirmAmount(contracts.paymentAgreements, createEventData.id);
	let retrieved = await paymentAgreements.get(contracts.paymentAgreements, createEventData.id);

	assertTrue(retrieved.amountActual === claimAmount, fn, "Expected amount actual to be " + claimAmount + " found " + retrieved.amountActual);
	assertTrue(retrieved.finished === true, fn, "Expected finished to be true, found " + retrieved.finished);

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
	compileAndDeployContract: compileAndDeployContract,
	testGetName: testGetName,
	testGet: testGet,
	testClaimAmount: testClaimAmount,
	testConfirmAmount: testConfirmAmount
};