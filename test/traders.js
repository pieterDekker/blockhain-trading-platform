const assert = require('assert');

let fileName = 'traders.sol';

let includes = ['trader.sol'];

let arguments = [];

let account = "";

function setAccount (_account) {
    account = _account;
}

/**
 * @callback passCallback
 * @param {String} functionName
 * @param {Error} error
 */
let reportFail = undefined;

/**
 * @callback failCallback
 * @param {String} functionName
 * @param {Number} [gasCost]
 */
let reportPass = undefined;

/**
 * Set the fail callback to the appropriate function
 * @param {failCallback} callback
 */
function setReportFail(callback) {
    reportFail = callback;
}

/**
 * Set the pass callback to the appropriate function
 * @param {passCallback} callback
 */
function setReportPass(callback) {
    reportPass = callback;
}

/**
 * 
 * @param {Eth.Contract} contract 
 */
function testGetName(contract) {
    contract.methods.getName().call()
        .then(name => {
            try {
                assert(name === "Trader collection", "Name should be \"Trader collection\"");
                reportPass('getName')
            } catch (error) {
                if (reportFail) {
                    reportFail('getName', error);
                }
            }
        })
        .catch(error => {
            if (reportFail) {
                reportFail('getName', error);
            }
        });
}

function testTest(contract) {
    assert(false, "This is a meta-test")
}

module.exports = {
    testGetName: testGetName,
    testTest: testTest,
    arguments: arguments,
    fileName: fileName,
    includes: includes,
    setReportFail: setReportFail,
    setReportPass: setReportPass,
    setExpect: setExpect,
    setAccount: setAccount
};