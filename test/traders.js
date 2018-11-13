const Web3 = require('web3');
const w3u = (new Web3()).utils;

let fileName = 'traders.sol';

let includes = ['trader.sol'];

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
 * @param contract
 */
function testMetaTest(contract) {
    let fn = "metaTest";
    expect_f(fileName, fn, 2);
    assertTrue(false, fn, "This should fail");
    assertTrue(true, fn, "This should pass");
}

/**
 * @param {Eth.Contract} contract
 */
function testGetName(contract) {
    let fn = "getName";
    expect_f(fileName, fn, 1);
    contract.methods.getName().call()
        .then(name => {
            assertTrue(name === "Trader collection", fn, "Name should be \"Trader collection\"");
        })
        .catch(error => {
            error_f(fileName, fn, error)
        });
}

function testNewTrader(contract) {
    let fn = "newTrader";
    expect_f(fileName, fn, 4);
    contract.methods.newTrader("TestTrader").send({from: account, gas: gasAmount})
        .then(() => {
            assertTrue(true, fn, "New trader receipt");
            contract.methods.accountHasTrader(account).call()
                .then(has_trader => {
                    assertTrue(has_trader, fn, "Account has trader returns " + has_trader)
                })
                .catch(error => {
                    error_f(fileName, fn, error);
                });

            contract.methods.getTraderForAccount(account).call()
                .then(trader_address => {
                    assertTrue(w3u.isAddress(trader_address), fn, "getTraderForAccount returns a valid address");
                })
                .catch(error => {
                    error_f(fileName, fn, error);
                });

            contract.methods.newTrader("TestTrader").send({from: account, gas: gasAmount})
                .then(() => {
                    fail_f(fileName, fn, "Second call to newTrader with same account should have failed");
                })
                .catch(() => {
                    pass_f(fileName, fn, "Second call to newTrader with same account failed")
                })
        })
        .catch(error => {
            error_f(fileName, fn, error);
        });
}

module.exports = {
    testMetaTest: testMetaTest,
    testGetName: testGetName,
    testNewTrader: testNewTrader,
    constructor_arguments: constructor_arguments,
    fileName: fileName,
    includes: includes,
    setFail: setFail,
    setPass: setPass,
    setExpect: setExpect,
    setError: setError,
    setAccount: setAccount,
    setGasAmount: setGasAmount
};