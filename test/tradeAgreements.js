const Web3 = require('web3');
const kp = require('keypair');
const testUtil = require('../test_util');
const fs = require('fs');
const node = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));

let fileName = 'tradeAgreements.sol';

let includes = ['bids.sol'];

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

async function compileAndDeployContract(account, gasAmount) {
	let bidsFile = fs.readFileSync('/home/pieter/bscinf/y3/bproject/docker/chain/contracts/bids.sol').toString();
	let bidsCompiled = testUtil.compileContractFromFile(bidsFile);
	let bidsContract =
		await (new node.eth.Contract(bidsCompiled.abi))
			.deploy({data: bidsCompiled.bytecode})
			.send({from: account, gas: gasAmount});
	let tradeAgreementsFile = fs.readFileSync('/home/pieter/bscinf/y3/bproject/docker/chain/contracts/tradeAgreements.sol').toString();
	let tradeAgreementsCompiled = testUtil.compileContractFromFileWithIncludes({'tradeAgreements.sol':tradeAgreementsFile},{'bids.sol':bidsFile});
	let tradeAgreementsContract =
		await (new node.eth.Contract(tradeAgreementsCompiled.abi))
			.deploy({data: tradeAgreementsCompiled.bytecode, arguments: [bidsContract._address]})
			.send({from: account, gas: gasAmount});
	return {tradeAgreements: tradeAgreementsContract, bids: bidsContract};
}

/**
 * @param {Eth.Contract} contracts
 */
function testGetName(contracts) {
	let fn = "getName";
	expect_f(fileName, fn, 1);
	contracts.tradeAgreements.methods.getName().call()
		.then(name => {
			assertTrue(name === "TradeAgreements", fn, "Name should be TradeAgreements, is " + name);
		})
		.catch(error => {
			error_f(fileName, fn, error);
		})
}

async function testCreate(contracts) {
	let fn = "create";
	expect_f(fileName, fn, 4);

	/** @type {Bid} */
	let offer = {
		type : 0,
		unit_price : 1,
		volume : 2,
		expires : 3,
		owner: account
	};

	/** @type {Bid} */
	let demand = {
		type : 1,
		unit_price : 2,
		volume : 2,
		expires : 3,
		owner: account
	};

	let ipfsUtil = require('../ipfs_util');
	let ipfsNode = await ipfsUtil.getNode();

	let keyPair = {};
	try {
		keyPair.public = ipfsUtil.getPublicKey();
		keyPair.private = ipfsUtil.getPrivateKey();
	} catch (e) {
		keyPair = kp();
		ipfsUtil.addPublicKey(account, keyPair.public);
		ipfsUtil.setPrivateKey(keyPair.private)
	}

	let offer_ipfs_file = await ipfsUtil.storeBid(ipfsNode, offer, keyPair.private);
	let offer_ipfs_file_bytes = testUtil.stringToBytes(offer_ipfs_file.path);

	let demand_ipfs_file = await ipfsUtil.storeBid(ipfsNode, demand, keyPair.private);
	let demand_ipfs_file_bytes = testUtil.stringToBytes(demand_ipfs_file.path);

	await contracts.bids.methods.newBid(offer_ipfs_file_bytes).send({from: account, gas: gasAmount}); //id 0
	await contracts.bids.methods.newBid(demand_ipfs_file_bytes).send({from: account, gas: gasAmount});//id 1

	/** @type {TradeAgreement} */
	let tradeAgreement = {
		offerer: account,
		demander: account,
		offer_file: offer_ipfs_file,
		offer_id: 0,
		demand_file: demand_ipfs_file,
		demand_id: 1,
		unit_price: 2,
		volume: 2,
		end_date: 5
	};

	let tradeAgreementIpfsFile = await ipfsUtil.storeTradeAgreement(ipfsNode, tradeAgreement, keyPair.private);
	let tradeAgreementIpfsFileBytes = testUtil.stringToBytes(tradeAgreementIpfsFile.path);
	let createReceipt = await contracts.tradeAgreements.methods.create(0, account, 1, account, tradeAgreementIpfsFileBytes).send({from:account, gas: gasAmount});
	assertTrue(createReceipt.events.NewTradeAgreement instanceof Object, fn, "receipt expected to be object, is " + typeof(createReceipt.events.NewTradeAgreement));

	let id = createReceipt.events.NewTradeAgreement.returnValues.id;
	let offerer = createReceipt.events.NewTradeAgreement.returnValues.offerer;
	let demander = createReceipt.events.NewTradeAgreement.returnValues.demander;
	assertTrue(id === "0", fn, "Expected new TradeAgreement id to be 0, found " + id);
	assertTrue(offerer === account, fn, "Expected new TradeAgreement offerer to be " + offerer + " , found " + offerer);
	assertTrue(demander === account, fn, "Expected new TradeAgreement demander to be " + demander + " , found " + demander);
	await ipfsNode.stop();
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
	testGetName: testGetName,
	testCreate: testCreate
};