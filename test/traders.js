const Web3 = require('web3');
const w3u = (new Web3()).utils;

function assertTrue(cond, function_name, message) {
    if (cond) {
        pass_f(function_name, message);
    } else {
        fail_f(function_name, message);
    }
}

let fileName = 'traders.sol';

let includes = ['trader.sol'];

let arguments = [];

let account = "";

let gasAmount;

function setAccount (_account) {
    account = _account;
}

function setGasAmount(_gasAmount) {
    gasAmount = _gasAmount;
}

/**
 * @callback passCallback
 * @param {String} functionName
 * @param {Error} error
 */
let fail_f = undefined;

/**
 * @callback failCallback
 * @param {String} functionName
 */
let pass_f = undefined;

let expect_f = undefined;

let error_f = undefined;

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

function setExpect(callback) {
    expect_f = callback;
}

function setError(callback) {
    error_f = callback;
}

function testMetaTest(contract) {
    let fn = "metaTest";
    expect_f(fn, 2);
    assertTrue(false, fn, "This should fail");
    assertTrue(true, fn, "This should pass");
}

/**
 *
 * @param {Eth.Contract} contract
 */
function testGetName(contract) {
    let fn = "getName";
    expect_f(fn, 1);
    contract.methods.getName().call()
        .then(name => {
            assertTrue(name === "Trader collection", fn, "Name should be \"Trader collection\"");
        })
        .catch(error => {
            error_f(fn, error)
        });
}

function testNewTrader(contract) {
    let fn = "newTrader";
    expect_f(fn, 4);
    contract.methods.newTrader("TestTrader").send({from: account, gas: gasAmount})
        .then(() => {
            assertTrue(true, fn, "New trader receipt");
            contract.methods.accountHasTrader(account).call()
                .then(has_trader => {
                    assertTrue(has_trader, fn, "Account has trader returns " + has_trader)
                })
                .catch(error => {
                    error_f(fn, error);
                });

            contract.methods.getTraderForAccount(account).call()
                .then(trader_address => {
                    assertTrue(w3u.isAddress(trader_address), fn, "getTraderForAccount returns a valid address");
                })
                .catch(error => {
                    error_f(fn, error);
                });

            contract.methods.newTrader("TestTrader").send({from: account, gas: gasAmount})
                .then(() => {
                    fail_f(fn, "Second call to newTrader with same account should have failed");
                })
                .catch((e) => {
                    pass_f(fn, "Second call to newTrader with same account failed")
                })
        })
        .catch(error => {
            error_f(fn, error);
        });
}

module.exports = {
    testMetaTest: testMetaTest,
    testGetName: testGetName,
    testNewTrader: testNewTrader,
    arguments: arguments,
    fileName: fileName,
    includes: includes,
    setFail: setFail,
    setPass: setPass,
    setExpect: setExpect,
    setError: setError,
    setAccount: setAccount,
    setGasAmount: setGasAmount
};