const fs = require('fs');
const Web3 = require('web3'); //For interaction with an eth node
const util = require('./test_util');
const sleep = require('sleep');

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

let result = {tests_finished: 0, expected_tests: 0};

let names = [];

function isTestFunction(propertyName, testModule) {
    return propertyName.indexOf('test') === 0 && testModule[propertyName] instanceof Function;
}

function getTestFunctions(testModule) {
    let testFunctions = [];
    for (let propertyName in testModule) {
        if (testModule.hasOwnProperty(propertyName) && isTestFunction(propertyName, testModule)) {
            testFunctions.push(propertyName);
        }
    }
    return testFunctions;
}

function getContractFuncName(testFuncName) {
    if (testFuncName.indexOf('test') === 0) {
        return testFuncName.substr(4);
    }
    throw Error("Test function names should start with 'test'")
}

function pass(functionName, gasCost = undefined) {
    if (!functionName in result) {
        result.tests_finished++;
        result[functionName] = {status: PASSED, gasCost: gasCost}
    } else {
        if (result[functionName].status === FAILED) {
            throw Error("Pass occured on failed function: " + functionName);
        }
    }
}

function fail(functionName, error) {
    if (!(functionName in result)) {
        result.tests_finished++;
        result[functionName] = {status: FAILED, errors: [error]}
    } else {
        if (result[functionName].status === FAILED) {
            result[functionName].errors.push(error);
        } else {
            throw Error("Error occured on passed function: " + functionName + "Message: " + error.message);
        }
    }
}

function runTests(testModule, contractInstance) {
    testModule.setReportFail(fail);
    testModule.setReportPass(pass);
    testModule.setAccount(testAccount);
    //run each testFunction
    let testFunctions = getTestFunctions(testModule);
    // console.log(testFunctions);
    for (let testFuncName of testFunctions) {
        let contractFuncName = util.upperToLowerCamelCase(getContractFuncName(testFuncName));

        names.push(contractFuncName);
        try {
            testModule[testFuncName](contractInstance);
        } catch (error) {
            fail(contractFuncName, error);
        }
    }
    let done = false;
    while (!done) {
        done = (result.tests_finished === testFunctions.length);
        console.log("we are " + done + " done(" + result.tests_finished + " results, need " + testFunctions.length + ")");
        console.log(result);
        sleep.msleep(200);
    }
    drawReport();
}

function drawReport() {
    console.log("All tests finished");
    let passed = 0;
    let failed = 0;
    for (let functionName of names) {
        if (result[functionName].status === PASSED) {
            let cost = "";
            if (result[functionName].gasCost !== undefined) {
                cost = " (" + result[functionName].gasCost + ")";
            }
            console.log(functionName + " passed! " + cost);
            passed++;
        } else {
            console.log(functionName + " failed:");
            result[functionName].errors.forEach(error => {
                console.log("\t" + error);
            });
            failed++;
        }
    }
    console.log((passed + failed) + " tests, " + passed + " passed, " + failed + " failed.");
}

fs.readdirSync(testDir).forEach(file => {
    //Load the test module
    let testModule = require(testDir + '/' + file);

    var compiled;
    try {
        let contractFile = fs.readFileSync(contractDir + '/' + testModule.fileName).toString();
        if (testModule.includes.length === 0) {
            compiled = util.compileContractFromFile(contractFile);
        } else {
            file = {};
            file[testModule.fileName] = contractFile;
            let includes = {};
            testModule.includes.forEach(includeFileName => {
                includes[includeFileName] = fs.readFileSync(contractDir + '/' + includeFileName).toString();
            });
            // console.log(file);
            // console.log(includes);
            compiled = util.compileContractFromFileWithIncludes(file, includes);
        }
    } catch (e) {
        console.log("Compilation failed: " + e.message);
        return;
    }


    let contract = new node.eth.Contract(compiled.abi);

    util.unlockAccount(node, testAccount, testPassword)
        .then(() => {
            contract.deploy({
                data: compiled.bytecode,
                arguments: testModule.arguments
            }).send({
                from: testAccount,
                gas: gasAmount
            })
                .then(contractInstance => {
                    runTests(testModule, contractInstance);
                })
                .catch(error => {
                    console.log("Could not deploy contract from " + file + ": " + error.message);
                    console.log(error);
                });
        })
        .catch(error => {
            console.log("Could not unlock account: " + error.message);
        });
});
console.log("Done reading");