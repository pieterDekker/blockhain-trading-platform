const fs = require('fs');
const solc = require('solc');
const Web3 = require('web3');
let node = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));

// console.log(node);

if (node === undefined) {
	console.log("WARNING: no node object");
} else if (node._provider.connected === false) {
	console.log("WARNING: node object has node provider connection");
}

function compileContracts() {
	let contracts = [
		['bid.sol', 'contracts/bid.sol'],
		['offer.sol', 'contracts/offer.sol'],
		['demand.sol', 'contracts/demand.sol'],
		['trader.sol', 'contracts/trader.sol']
	];
	let contractnames = [
		'Bid',
		'Offer',
		'Demand',
		'Trader'
	];

	let contractCodes = {}

	contracts.forEach(element => {
		console.log(element);
		contractCodes[element[0]] = fs.readFileSync(element[1]).toString();
	});

	console.log(contractCodes);

	// contract_code = fs.readFileSync(file);
	intermediate_output = solc.compile({sources: contractCodes}, 1);
	console.log(intermediate_output);
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


function getContractInstance(abi, address = "") {
	let contract;
	if (address !== "") {
		contract = new node.eth.Contract(abi, address);
	} else {
		contract = new node.eth.Contract(abi);
	}
	return contract
}

function getContractDeployTxObj(bytecode, abi, arguments) {
	let contract = new node.eth.Contract(abi);

	let txObj = contract.deploy({
		data:bytecode,
		arguments: arguments
	});

	return txObj;
}

function sendContractDeployTxObj(txObj, account, gas, error_f, success_f) {
	txObj.send({
		from: account,
		gas: gas
	})
	.on('error', error_f)
	.on('receipt', success_f);
}

function estimateGas(txObj, error_f, success_f) {
	txObj.estimateGas({}, function(error, gasEstimate) {
		if (error) {
			error_f(error);
		} else {
			success_f(gasEstimate);
		}
	});
}

let bytecode = "0x" + fs.readFileSync('bin/Demand.bin');
let abi = JSON.parse(fs.readFileSync('bin/Demand.abi'), {encoding: "utf-8"});

let demandDeployTxObj = getContractDeployTxObj(bytecode, abi, [1,10,100000]);

let estimate_error_f = function (error) {
	console.log(error);
}

let estimate_success_f = function (estimate) {
	console.log("estimated gas cost: " + estimate);
}

estimateGas(demandDeployTxObj, estimate_error_f, estimate_success_f);

let senddeploy_error_f = function (error) {
	console.log("Sending the contract deploying function failed");
	console.log(error);
}

let senddeploy_success_f = function (receipt) {
	console.log("contract deployment successful, address: " + receipt.contractAddress);
	console.log("pinging the contract name");
	cInst = getContractInstance(abi, receipt.contractAddress);
	// console.log(cInst);
	cInst.methods.getName().call(function (error, name) {
		if (!error) {
			console.log(name);
		}
	});
}

console.log(compileContracts());

// console.log(node.eth.personal.unlockAccount("0xae7fed7156e6856f65f7a1a0318ec7ce639ba94c", "testaccount"));
node.eth.personal.unlockAccount("0xae7fed7156e6856f65f7a1a0318ec7ce639ba94c", "testaccount")
.then(function (_) {
	sendContractDeployTxObj(demandDeployTxObj, "0xae7fed7156e6856f65f7a1a0318ec7ce639ba94c", 1000000000000, senddeploy_error_f, senddeploy_success_f);
})
.catch(function (error) {
	console.log(error);
});


// process.exit()
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// const account_address = "0xae7fed7156e6856f65f7a1a0318ec7ce639ba94c";
// const account_passphrase = "testaccount";


// let byte_code = "0x" + fs.readFileSync('bin/Demand.bin');
// let abi = JSON.parse(fs.readFileSync('bin/Demand.abi'), {encoding: "utf-8"});

// let contract = new node.eth.Contract(abi);
// console.log("about to deploy");

// console.log(node.eth.personal.unlockAccount(account_address, account_passphrase));

// let txobj = contract.deploy({
// 	data: byte_code,
// 	arguments: [10, 1, 10000]
// });

// txobj.estimateGas({}, function (error, gasEstimate) {
// 	if (error) {
// 		console.log("gas price estimate error:");
// 		console.log(error);
// 	}
// 	if (gasEstimate) {
// 		console.log("estimated gas cost: " + gasEstimate);
// 	}
// });

// txobj.send({
// 	from: account_address,
// 	gas: 100000000000000
// }, function (error, txHash) {
// 	console.log("general error:");
// 	console.log(error);
// 	console.log("general txHash:");
// 	console.log(txHash);
// }).on('error', function (error) {
// 	console.log("error error:");
// 	console.log(error);
// }).on('transactionHash', function (txHash) {
// 	console.log("txHash txHash:");
// 	console.log(txHash);
// }).on('receipt', function(receipt){
// 	console.log("receipt receipt:")
// 	console.log(receipt.contractAddress) // contains the new contract address
//  }).on('confirmation', function(confirmationNumber, receipt) {
// 	 if (confirmationNumber > 0) {
// 		 process.exit();
// 	 }
// 	console.log("confirmation confirmationNumber:")
// 	console.log(confirmationNumber);
// 	console.log("confirmation receipt");
// 	console.log(receipt);
//  }).then(function(newContractInstance){
// 	console.log("newContractInstance newContractInstance");
// 	console.log(newContractInstance.options.address); // instance with the new contract address
// 	newContractInstance.methods['getName']().call({from: account_address}, function(error, result) {
// 		if (error) {
// 			console.log("getName failed");
// 			console.log(error);
// 		}
// 		if (result) {
// 			console.log(result);
// 		}
// 	});

// 	newContractInstance.methods.testReachability().call({from: account_address}, function(error, result) {
// 		if (error) {
// 			console.log("testReachability failed");
// 			console.log(error);
// 		}
// 		if (result) {
// 			console.log(result);
// 		}
// 	});
//  });