const Web3 = require('web3');
const w3u = (new Web3()).utils;

let fileName = 'lottery.sol';

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

/**
 * @param {Eth.Contract} contract
 */
function testGetName(contract) {
	let fn = "getName";
	expect_f(fileName, fn, 1);
	contract.methods.getName().call()
		.then(name => {
			assertTrue(name === "Tickets", fn, "Name should be Tickets, is " + name);
		})
		.catch(error => {
			error_f(fileName, fn, error);
		})
}

function testIssueTicket(contract) {
	let fn = "issueTicket";
	expect_f(fileName, fn, 5);
	contract.methods.issueTicket(account).send({from: account, gas: gasAmount})
		.then(() => {
			contract.methods.getTickets().call()
				.then(tickets => {
					assertTrue(tickets.length >= 1, fn, "'tickets' should contain at least 1 ticket, contains " + tickets.length);
					assertTrue(tickets[0] === account, fn, "'tickets[0]' should be " + account + ", is " + tickets[0]);
				})
				.catch(error => {
					error_f(fileName, fn, error);
				});
			contract.methods.getMin().call()
				.then(min => {
					assertTrue(min === '0', fn, "'min' should be 0, is " + min);
				})
				.catch(error => {
					error_f(fileName, fn, error);
				});
			contract.methods.getMax().call()
				.then(max => {
					assertTrue(max > '1', fn, "'max' should be greater than 1, is " + max);
				})
				.catch(error => {
					error_f(fileName, fn, error);
				});
			contract.methods.getTraderTicketAmount(account).call()
				.then(traderTicketAmount => {
					assertTrue(traderTicketAmount >= 1, fn, "'Amount of tickets for " + account + " should be at least 1, is " + traderTicketAmount);
				})
		})
		.catch(error => {
			error_f(fileName, fn, error);
		})
}

function testIssueTickets(contract) {
	let fn = "issueTickets";
	expect_f(fileName, fn, 1);
	contract.methods.issueTickets(account, 5).send({from: account, gas: gasAmount})
		.then(() => {
			contract.methods.getTickets().call()
				.then(tickets => {
					assertTrue(tickets.length >= 5, fn, "'tickets' should contain at least 5 tickets, contains " + tickets.length);
				})
				.catch(error => {
					error_f(fileName, fn, error);
				});
		})
		.catch(error => {
			error_f(fileName, fn, error);
		})
}

function testRemoveTicket(contract) {
	let fn = "removeTicket";
	expect_f(fileName, fn, 1);
	contract.methods.issueTickets(account, 5).send({from: account, gas: gasAmount})
		.then(() => {
			contract.methods.removeTicket(3).send({from: account, gas: gasAmount})
				.then(() => {
					contract.methods.getTicket(3).call()
						.then(ticket => {
							assertTrue(ticket === "0x0000000000000000000000000000000000000000", fn, "tickets[3] should be empty after removal, is " + ticket);
						})
						.catch(error => {
							error_f(fileName, fn, error);
						});
				})
				.catch(error => {
					error_f(fileName, fn, error);
				});
		})
		.catch(error => {
			error_f(fileName, fn, error);
		});
}

function testDraw(contract) {
	let fn = "draw";
	expect_f(fileName, fn, 2);
	contract.methods.draw().send({from: account, gas: gasAmount})
		.then(receipt => {
			assertTrue(true, fn, "New leader drawn from ticket " + receipt.events.NewLeader.returnValues.ticket);
			assertTrue(receipt.events.NewLeader.returnValues.leader === account, fn, "New leader should be " + account + ", is " + receipt.events.NewLeader.returnValues.leader);
		})
		.catch(error => {
			error_f(fileName, fn, error)
		})
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
	testIssueTicket: testIssueTicket,
	testIssueTickets: testIssueTickets,
	testRemoveTicket: testRemoveTicket,
	testDraw: testDraw
};