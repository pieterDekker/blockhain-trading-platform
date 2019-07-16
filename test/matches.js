const nodeUtils = require('../node_utils');
const ipfsUtils = require('../ipfs_util');
const testUtil = require('../test_util');
const eventUtils = require('../event_utils');
const fs = require('fs');

const marketplace = require('../marketplace');
const matches = require('../matches');

const node = nodeUtils.getNode();

let fileName = 'matches.sol';

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
	matches.init(account, gasAmount);
}


async function compileAndDeployContract(account, gasAmount) {
	let marketplaceFile = fs.readFileSync('/home/pieter/bscinf/y3/bproject/docker/chain/contracts/marketplace.sol').toString();
	let marketplaceCompiled = testUtil.compileContractFromFile(marketplaceFile);
	let marketplaceContract =
		await (new node.eth.Contract(marketplaceCompiled.abi))
			.deploy({data: marketplaceCompiled.bytecode})
			.send({from: account, gas: gasAmount});

	let tradeAgreementsFile = fs.readFileSync('/home/pieter/bscinf/y3/bproject/docker/chain/contracts/tradeAgreements.sol').toString();
	let tradeAgreementsCompiled = testUtil.compileContractFromFile(tradeAgreementsFile);
	let tradeAgreementsContract =
		await (new node.eth.Contract(tradeAgreementsCompiled.abi))
			.deploy({data: tradeAgreementsCompiled.bytecode})
			.send({from: account, gas: gasAmount});

	let matchesFile = fs.readFileSync('/home/pieter/bscinf/y3/bproject/docker/chain/contracts/matches.sol').toString();
	let matchesCompiled = testUtil.compileContractFromFileWithIncludes({'matches.sol':matchesFile}, {'tradeAgreements.sol':tradeAgreementsFile});
	let matchesContract =
		await (new node.eth.Contract(matchesCompiled.abi))
			.deploy({data: matchesCompiled.bytecode, arguments:[tradeAgreementsContract._address]})
			.send({from: account, gas: gasAmount});

	return {marketplace: marketplaceContract, matches: matchesContract, tradeAgreements: tradeAgreementsContract};
}

async function testPublish(contracts) {
	let fn = "publish";
	expect_f(fileName, fn, 2);

	let offer = marketplace.newBidObject(0,1,2,3, account);
	let offerIndex = await marketplace.publishBid(contracts.marketplace, offer);
	let offerPath = await marketplace.getBidPath(contracts.marketplace, offerIndex);

	let demand = marketplace.newBidObject(1,1,2,3, account);
	let demandIndex = await marketplace.publishBid(contracts.marketplace, demand);
	let demandPath = await marketplace.getBidPath(contracts.marketplace, demandIndex);

	let match = matches.newMatchObject(account, offerPath, account, demandPath, 1, 2,3);
	let index = await matches.publish(contracts.matches, match);
	pass_f(fileName, fn, "publish returned an index: " + index);
	let retrieved = await matches.get(contracts.matches, index);
	assertTrue(matches.matchesAreEqual(match, retrieved), fn, "Expected original match and retrieved match to be equal");
}

async function testAcceptOffer(contracts) {
	let fn = "acceptOffer";
	expect_f(fileName, fn, 1);

	let offer = marketplace.newBidObject(0,1,2,3, account);
	let offerIndex = await marketplace.publishBid(contracts.marketplace, offer);
	let offerPath = await marketplace.getBidPath(contracts.marketplace, offerIndex);

	let demand = marketplace.newBidObject(1,1,2,3, account);
	let demandIndex = await marketplace.publishBid(contracts.marketplace, demand);
	let demandPath = await marketplace.getBidPath(contracts.marketplace, demandIndex);

	let match = matches.newMatchObject(account, offerPath, account, demandPath, 1, 2,3);
	let index = await matches.publish(contracts.matches, match);
	await matches.acceptOffer(contracts.matches, index);
	let retrieved = await matches.get(contracts.matches, index);
	assertTrue(retrieved.demandOwnerAccepted, fn, "Expected demandOwnerAccepted to be true, found " + retrieved.demandOwnerAccepted);
}

async function testAcceptDemand(contracts) {
	let fn = "acceptDemand";
	expect_f(fileName, fn, 1);

	let offer = marketplace.newBidObject(0,1,2,3, account);
	let offerIndex = await marketplace.publishBid(contracts.marketplace, offer);
	let offerPath = await marketplace.getBidPath(contracts.marketplace, offerIndex);

	let demand = marketplace.newBidObject(1,1,2,3, account);
	let demandIndex = await marketplace.publishBid(contracts.marketplace, demand);
	let demandPath = await marketplace.getBidPath(contracts.marketplace, demandIndex);

	let match = matches.newMatchObject(account, offerPath, account, demandPath, 1, 2,3);
	let index = await matches.publish(contracts.matches, match);
	await matches.acceptDemand(contracts.matches, index);
	let retrieved = await matches.get(contracts.matches, index);
	assertTrue(retrieved.offerOwnerAccepted, fn, "Expected offerOwnerAccepted to be true, found " + retrieved.offerOwnerAccepted);
}

async function testCreateAgreement(contracts) {
	let fn = "createAgreement";
	expect_f(fileName, fn, 2);

	let offer = marketplace.newBidObject(0,1,2,3, account);
	let offerIndex = await marketplace.publishBid(contracts.marketplace, offer);
	let offerPath = await marketplace.getBidPath(contracts.marketplace, offerIndex);

	let demand = marketplace.newBidObject(1,1,2,3, account);
	let demandIndex = await marketplace.publishBid(contracts.marketplace, demand);
	let demandPath = await marketplace.getBidPath(contracts.marketplace, demandIndex);

	let match = matches.newMatchObject(account, offerPath, account, demandPath, 1, 2,3);
	let matchIndex = await matches.publish(contracts.matches, match);
	await matches.acceptOffer(contracts.matches, matchIndex);
	let receipt = await matches.acceptDemand(contracts.matches, matchIndex);
	let eventData = eventUtils.dataFromReceipt(receipt, "NewTradeAgreement");

	assertTrue(eventData.offerOwner === account, fn, "expected NewTradeAgreement.offerOwner to be " + account + " found " + eventData.offerOwner);
	assertTrue(eventData.demandOwner === account, fn, "expected NewTradeAgreement.demandOwner to be " + account + " found " + eventData.demandOwner);

	let retrievedMatch = await matches.get(contracts.matches, matchIndex);
	assertTrue(retrievedMatch.agreementCreated, fn, "Agreement created");
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
	compileAndDeployContract: compileAndDeployContract,
	init: init,
	testPublish: testPublish,
	testAcceptOffer: testAcceptOffer,
	testAcceptDemand: testAcceptDemand,
	testCreateAgreement: testCreateAgreement
};