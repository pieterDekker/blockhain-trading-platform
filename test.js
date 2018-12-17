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
let testAccount = "0x47681d90A3B1B044980c39ed1e32D160a8043Ceb";
let testPassword = "testaccount";
let gasAmount = 100000000000;

// let result = {finished_tests: 0, expected_tests: 0};
let result = [];

let fileNames = {};

/**
 * Log a failed assertion.
 *
 * @param {String} message
 */
function logFail(message) {
	console.log("\t" + log_sym.error, chalk.red(message));
}

/**
 * Log a warning message about test results.
 *
 * @param {String} message
 */
function logWarning(message) {
	console.log(log_sym.warning, chalk.yellow(message));
}

/**
 * Log a passed assertion.
 *
 * @param {String} message
 */
function logPass(message) {
	console.log("\t" + log_sym.success, chalk.green(message));
}

/**
 *
 * @param {string} propertyName
 * @param {Object} testModule
 * @return {boolean} True if testModule.propertyName is a function and starts with 'test'
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
 * Extracts the name of a contract function a test function corresponds to.
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
 * @param fileName
 * @param functionName
 * @return {boolean}
 */
function testFinished(fileName, functionName) {
	return result[fileName][functionName].assertions.length === result[fileName][functionName].assertions_expected ||
		result[fileName][functionName].errors.length > 0;
}

/**
 * Check that all tests for a module are finished.
 *
 * @param fileName
 * @return {boolean}
 */
function testModuleFinished(fileName) {
	return result[fileName].expected_tests === result[fileName].finished_tests;
}

/**
 * Perform post test actions.
 *
 * @param fileName
 */
function postTest(fileName) {
	if (testModuleFinished(fileName)) {
		drawReport(fileName)
	}
}

/**
 * Register an expected test with name and number of expected assertions.
 *
 * @param fileName
 * @param functionName
 * @param num_assertions
 */
function expectTest(fileName, functionName, num_assertions) {
	result[fileName][functionName] = {
		assertions_expected: num_assertions,
		assertions: [],
		errors: []
	};
}

/**
 * Register a passed assertion for a test.
 *
 * @param fileName
 * @param functionName
 * @param message
 */
function pass(fileName, functionName, message) {
	result[fileName][functionName].assertions.push({status: PASSED, message: message});
	if (testFinished(fileName, functionName)) {
		result[fileName].finished_tests += 1;
		// console.log("finished " + functionName);
	}
	postTest(fileName);
}

/**
 * Register a failed assertion for a test.
 *
 * @param fileName
 * @param functionName
 * @param message
 */
function fail(fileName, functionName, message) {
	result[fileName][functionName].assertions.push({status:FAILED, message: message});
	if (testFinished(fileName, functionName)) {
		result[fileName].finished_tests += 1;
		// console.log("finished " + functionName);
	}
	postTest(fileName);
}

/**
 * Register an error that occurred during a test.
 *
 * @param fileName
 * @param functionName
 * @param error
 */
function error(fileName, functionName, error) {
	result[fileName][functionName].errors.push(error);
	postTest(fileName);
}

/**
 * Run all the test found in testModule on contractInstance.
 *
 * @param testModule
 * @param contractInstance
 */
function runTests(testModule, contractInstance) {
	return new Promise(async (resolve, reject) => {
		testModule.setFail(fail);
		testModule.setPass(pass);
		testModule.setExpect(expectTest);
		testModule.setError(error);
		testModule.setAccount(testAccount);
		testModule.setGasAmount(gasAmount);
		//run each testFunction
		let testFunctions = getTestFunctions(testModule);
		result[testModule.fileName] = {
			expected_tests: testFunctions.length,
			finished_tests: 0
		};
		fileNames[testModule.fileName] = [];
		for (let testFuncName of testFunctions) {
			let contractFuncName = util.upperToLowerCamelCase(getContractFuncName(testFuncName));

			fileNames[testModule.fileName].push(contractFuncName);
			try {
				await testModule[testFuncName](contractInstance);
			} catch (error) {
				console.log("Unexpected error while testing " + contractFuncName + ": " + error.message);
				console.log(error);
			}
		}
	});
}

/**
 * Draw up a report of all the results of tests in the given module.
 *
 * @param {String} fileName
 */
function drawReport(fileName) {
	let file = fileNames[fileName];
	console.log("");
	console.log("Tested " + file.length + " functions for " + fileName + ". Results:");
	let had_errors;
	for (let functionName of file) {
		console.log("Tested " + functionName + ":");
		for (let assertion of result[fileName][functionName].assertions) {
			if (assertion.status === PASSED) {
				logPass(assertion.message)
			} else {
				logFail(assertion.message)
			}
		}
		for (let error of result[fileName][functionName].errors) {
			had_errors = true;
			console.log("An error occurred in " + functionName + " of " + fileName);
			console.log(error);
			console.log("");
		}
		console.log("");
	}
	if (had_errors) {
		logWarning("There were errors in tests for " + fileName + ". Reporting is not reliable.");
	}

}

function prepareTest(fileName) {
	//Load the test module
	let testModule = require(testDir + '/' + fileName);

	//Compile the contract under test in testModule
	let compiled;
	try {
		if (!(testModule.compileAndDeployContract instanceof Function)) {
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
			return {
				module: testModule,
				contract: new node.eth.Contract(compiled.abi),
				bytecode: compiled.bytecode
			}
		}
		return {
			module: testModule
		}
	} catch (e) {
		console.log("Compilation failed: " + e.message);
		return {};
	}
}

function unlockAndRun(test, fileName) {
	util.unlockAccount(node, testAccount, testPassword)
		.then(async () => {
			let contractInstance;

			if (test.module.compileAndDeployContract instanceof Function) {
				contractInstance = await test.module.compileAndDeployContract(testAccount, gasAmount);
			} else {
				contractInstance = await test.contract
					.deploy({
						data: test.bytecode,
						arguments: test.module.constructor_arguments
					})
					.send({
						from: testAccount,
						gas: gasAmount
					});
			}

			try {
				console.log('running tests in ' + test.module.fileName);
				await runTests(test.module, contractInstance);
				console.log('done testing ' + test.module.fileName);
			} catch (error) {
				console.log("Unexpected error in runTests for " + test.module.fileName + ": " + error.message);
				console.log(error);
			}
		})
		.catch(error => {
			console.log("Could not unlock account: " + error.message);
		});
}

console.log("SolTest 0.1");
console.log("A minimalist, project specific testing framework for Ethereum smart contracts written in solidity");
console.log("Author: Pieter Dekker");

if (process.argv.length > 2) {
	for (i = 2; i < process.argv.length; i++) {
		let fileName = process.argv[i];
		if (fs.existsSync(testDir + '/' + fileName)) {
			console.log("Running tests in " + fileName);
			let test = prepareTest(fileName);
			unlockAndRun(test, fileName);
		} else {
			console.log("could not find " + fileName + " in " + testDir);
		}
	}

} else {
	//For each file found in the testDirectory
	console.log("running all tests in /test");
	fs.readdirSync(testDir).forEach(file_name => {
		let test = prepareTest(file_name);
		unlockAndRun(test, file_name);
	});
}