const fs = require('fs');
const Web3 = require('web3'); //For interaction with an eth node
const util = require('./test_util');
const log_sym = require('log-symbols');
const chalk = require('chalk');

const FAILED = 0;
const PASSED = 1;

//Find a running node on localhost
let node = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));
// const web3_utils = node.utils;
let testDir = './test';
let contractDir = './contracts';
let testAccount = "0x47681d90a3b1b044980c39ed1e32d160a8043ceb";
let testPassword = "testaccount";
let gasAmount = 1000000000000;

let result = {finished_tests: 0, expected_tests: 0};

let names = [];

function logFail(string) {
    console.log("\t" + log_sym.error, chalk.red(string));
}

function logWarning(string) {
    console.log(log_sym.warning, chalk.yellow(string));
}

function logPass(string) {
    console.log("\t" + log_sym.success, chalk.green(string));
}

/**
 *
 * @param {string} propertyName
 * @param {Object} testModule
 * @return {boolean} True if testmModule.propertyName is a function an starts with 'test'
 */
function isTestFunction(propertyName, testModule) {
    return propertyName.indexOf('test') === 0 && testModule[propertyName] instanceof Function;
}

/**
 * Extracts all the test functions according to isTestFunction, returns them in an array.
 *
 * @param testModule
 * @return {Array}
 */
function getTestFunctions(testModule) {
    let testFunctions = [];
    for (let propertyName in testModule) {
        if (testModule.hasOwnProperty(propertyName) && isTestFunction(propertyName, testModule)) {
            testFunctions.push(propertyName);
        }
    }
    return testFunctions;
}

/**
 * Extracts the name of a contract function a test function corresponds to
 *
 * @param testFuncName
 * @return {string}
 */
function getContractFuncName(testFuncName) {
    if (testFuncName.indexOf('test') === 0) {
        return testFuncName.substr(4);
    }
    throw Error("Test function names should start with 'test'")
}

/**
 * Check that the test for a certain function is finished,i.e.: all assertions completed or an error occurred.
 *
 * @param functionName
 * @return {boolean}
 */
function testFinished(functionName) {
    return result[functionName].assertions.length === result[functionName].assertions_expected ||
        result[functionName].errors.length > 0;
}

/**
 * Check that all tests for a module are finished.
 *
 * @return {boolean}
 */
function testModuleFinished() {
    return result.expected_tests == result.finished_tests;
}

/**
 * Perform post test actions.
 */
function postTest() {
    if (testModuleFinished()) {
        drawReport()
    }
}

/**
 * Register an expected test with name and number of expected assertions.
 *
 * @param functionName
 * @param num_assertions
 */
function expectTest(functionName, num_assertions) {
    result[functionName] = {
        assertions_expected: num_assertions,
        assertions: [],
        errors: []
    };
}

/**
 * Register a passed assertion for a test.
 *
 * @param functionName
 * @param message
 */
function pass(functionName, message) {
    result[functionName].assertions.push({status: PASSED, message: message});
    if (testFinished(functionName)) {
        result.finished_tests += 1;
    }
    postTest();
}

/**
 * Register a failed assertion for a test.
 *
 * @param functionName
 * @param message
 */
function fail(functionName, message) {
    result[functionName].assertions.push({status:FAILED, message: message});
    if (testFinished(functionName)) {
        result.finished_tests += 1;
    }
    postTest();
}

/**
 * Register an error that occurred during a test.
 * @param functionName
 * @param error
 */
function error(functionName, error) {
    result[functionName].errors.push(error);
    postTest();
}

/**
 * Run all the test found in testModule on contractInstance.
 * @param testModule
 * @param contractInstance
 */
function runTests(testModule, contractInstance) {
    testModule.setFail(fail);
    testModule.setPass(pass);
    testModule.setExpect(expectTest);
    testModule.setError(error);
    testModule.setAccount(testAccount);
    testModule.setGasAmount(gasAmount);
    //run each testFunction
    let testFunctions = getTestFunctions(testModule);
    result.expected_tests = testFunctions.length;
    for (let testFuncName of testFunctions) {
        let contractFuncName = util.upperToLowerCamelCase(getContractFuncName(testFuncName));

        names.push(contractFuncName);
        try {
            testModule[testFuncName](contractInstance);
        } catch (error) {
            console.log("Unexpected error while testing " + contractFuncName + ": " + error.message);
        }
    }
}

/**
 * Draw up a report of all the tests in the module currently under test.
 */
function drawReport() {
    // console.log(result);
    let had_errors;
    for (let name of names) {
        console.log("Tested " + name + ":");
        for (let assertion of result[name].assertions) {
            if (assertion.status === PASSED) {
                logPass(assertion.message)
            } else {
                logFail(assertion.message)
            }
        }
        for (let error of result[name].errors) {
            had_errors = true;
            console.log(error);
        }
        console.log("");
    }
    if (had_errors) {
        logWarning("There were errors. Reporting is not reliable.");
    }
}

//For each file found in the testDirectory
fs.readdirSync(testDir).forEach(file_name => {
    //Load the test module
    let testModule = require(testDir + '/' + file_name);

    //Compile the contract under test in testModule
    var compiled;
    try {
        let contractFile = fs.readFileSync(contractDir + '/' + testModule.fileName).toString();
        if (testModule.includes.length === 0) {
            compiled = util.compileContractFromFile(contractFile);
        } else {
            let file = {};
            file[testModule.fileName] = contractFile;
            let includes = {};
            testModule.includes.forEach(includeFileName => {
                includes[includeFileName] = fs.readFileSync(contractDir + '/' + includeFileName).toString();
            });
            compiled = util.compileContractFromFileWithIncludes(file, includes);
        }
    } catch (e) {
        console.log("Compilation failed: " + e.message);
        return;
    }

    //Create a new contract instance
    let contract = new node.eth.Contract(compiled.abi);

    util.unlockAccount(node, testAccount, testPassword)
        .then(() => {
            contract
                .deploy({
                data: compiled.bytecode,
                arguments: testModule.arguments
                })
                .send({
                from: testAccount,
                gas: gasAmount
                })
                .then(contractInstance => {
                    runTests(testModule, contractInstance);
                })
                .catch(error => {
                    console.log("Could not deploy contract from " + file_name + ": " + error.message);
                    console.log(error);
                });
        })
        .catch(error => {
            console.log("Could not unlock account: " + error.message);
        });
});
// console.log("Done reading");