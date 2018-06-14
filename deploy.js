const fs = require('fs'); //For filesystem interactions
const solc = require('solc'); //For compiling solidity contracts
const Web3 = require('web3'); //For interaction with an eth node

//Find a running node on localhost
let node = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));

//TODO calculate in the delay, event
if (node === undefined) {
	console.error("FATAL: no node object");
}

function checkUntilConnected () {
	console.log("checking if connected...");
	setTimeout(() => {
		if (isNodeConnected(node)) {
			console.log("connected");
			return;
		}
		console.log("not yet connected....");
		checkUntilConnected();
	}, 500);
}

function isNodeConnected (node) {
	if (node._provider.connected === false) {
		console.error("WARNING: node object has node provider connection");
		return false;
	}
	return true;
}

/**
 * Compiles the contracts in sourcedir, returns an object with ABIs, bytecodes and gas estimates. 
 * 
 * @param {string} sourcedir The directory containing the contracts to compile
 * 
 * @return {object} Contains compilation results, keyed by contract Name as defined inside the file
 * @return {object.abi} The ABI of the compiled contract, should be used to create an instance
 * @return {object.bytecode} The bytecode of the compiled contract, should be used for deployment
 * @return {object.deployment_gas_estimate} An estimate of the gas cost for deployment
 */
function compileContracts(sourcedir) {
	let contractfiles = {};
	fs.readdirSync(sourcedir).forEach(file => {
		if (file.substring(file.length - 4) === ".sol") {
			contractfiles[file] = fs.readFileSync(sourcedir + "/" + file).toString();
		}
	});

	intermediate_output = solc.compile({sources: contractfiles}, 1);
	if (intermediate_output === undefined) {
		console.log("Error, compilation of " + file + " failed");
		return {};	
	}

	compiled_contracts = {};
	Object.entries(intermediate_output.contracts).forEach(element => {
		let split = element[0].indexOf(':');
		let name = element[0].substring(split+1);
		compiled_contract = {
			bytecode: element[1].bytecode,
			abi: element[1].interface,
			deployment_cost_estimate: element[1].gasEstimates.creation[1]
		};
		compiled_contracts[name] = compiled_contract;
	});
	return compiled_contracts;
}

/**
 * Get an instance of a contract at address.
 * 
 * @param {object} abi 
 * @param {string} address 
 */
function getContractInstance(abi, address = "") {
	let contract;
	if (address !== "") {
		contract = new node.eth.Contract(abi, address);
	} else {
		contract = new node.eth.Contract(abi);
	}
	return contract
}

/**
 * Creates a transaction object for the deployment of a contract. Sending this transaction will send the bytecode and the arguments.
 * 
 * @param {string} bytecode 
 * @param {object} abi 
 * @param {Array} arguments 
 */
function getContractDeployTxObj(bytecode, abi, arguments) {
	let contract = new node.eth.Contract(abi);

	let txObj = contract.deploy({
		data:bytecode,
		arguments: arguments
	});

	return txObj;
}

/**
 * Sends the transaction to deploy a contract in the given transaction object.
 * 
 * @param {object} txObj 
 * @param {string} account 
 * @param {int} gas 
 * @param {function} error_f The function to be called on error, should take a single string as argument
 * @param {function} success_f The function to be called on success, should take a single receipt object as argument
 */
function sendContractDeployTxObj(txObj, account, gas, error_f, success_f) {
	txObj.send({
		from: account,
		gas: gas
	})
	.on('error', error_f)
	.on('receipt', success_f);
}

/**
 * Gets the gasestimate for the transaction in the given transaction object, or error.
 */
function estimateGas(txObj, error_f, success_f) {
	txObj.estimateGas({}, function(error, gasEstimate) {
		if (error) {
			error_f(error);
		} else {
			success_f(gasEstimate);
		}
	});
}

checkUntilConnected();

//abi and 
let bytecode = "0x" + fs.readFileSync('bin/Demand.bin');
let abi = JSON.parse(fs.readFileSync('bin/Demand.abi'), {encoding: "utf-8"});

let demandDeployTxObj = getContractDeployTxObj(bytecode, abi, [1,10,100000]);

let estimate_error_f = function (error) {
	console.error(error);
}

let estimate_success_f = function (estimate) {
	console.log("estimated gas cost: " + estimate);
}

estimateGas(demandDeployTxObj, estimate_error_f, estimate_success_f);

let senddeploy_error_f = function (error) {
	console.error("Sending the contract deploying function failed");
	console.error(error);
}

let senddeploy_success_f = function (receipt) {
	console.log("contract deployment successful, address: " + receipt.contractAddress);
	console.log("pinging the contract name");
	cInst = getContractInstance(abi, receipt.contractAddress);
	cInst.methods.getName().call(function (error, name) {
		if (!error) {
			console.error(name);
		}
	});
}

node.eth.personal.unlockAccount("0xae7fed7156e6856f65f7a1a0318ec7ce639ba94c", "testaccount")
.then(function (_) {
	sendContractDeployTxObj(demandDeployTxObj, "0xae7fed7156e6856f65f7a1a0318ec7ce639ba94c", 1000000000000, senddeploy_error_f, senddeploy_success_f);
})
.catch(function (error) {
	console.error(error);
});