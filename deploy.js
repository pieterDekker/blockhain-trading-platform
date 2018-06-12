const fs = require('fs');
const solc = require('solc');
const Web3 = require('web3');
let node = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:8545'));

rpc_failed = false;
if (node == undefined) {
	console.log("No node rpc instance, trying ipc....");
	rpc_failed = true;
} else if (node._provider.connected === false) {
	console.log("Node instance not connected to provider rpc, trying ipc...");
	// console.log(node);
	rpc_failed = true;
}

if (rpc_failed) {
	var web3_extended = require('web3_extended');

	var options = {
	host: '/home/pieter/bscinf/y3/bproject/docker/chain/private_chain/geth.ipc',
	ipc:true,
	personal: true, 
	admin: true,
	debug: true
	};

	node = web3_extended.create(options);

	console.log(node);

	if (node == undefined) {
		console.log("No node ipc instance, exiting....");
		process.exit();
	} else if (node === false) {
		console.log("Node instance not connected to provider ipc, exiting...");
		// console.log(node);
		process.exit();
	}
}

// function compileContract(file, contract_name) {
// 	contract_code = fs.readFileSync(file);
// 	intermediate_output = solc.compile(contract_code.toString(), 1);
// 	console.log(intermediate_output);
// 	if (intermediate_output === undefined) {
// 		console.log("Error, compilation of " + file + " failed");
// 		return {};
// 	}
// 	if (intermediate_output[contract_name] !== undefined) {
// 		return {
// 			bytecode: intermediate_output[contract_name].bytecode,
// 			abi: JSON.parse(intermediate_output[contract_name].interface)
// 		};
// 	}
// 	console.log("contract name not found in compiled object");
// 	return {};
// }


function getContractInstance(abi, address = "") {
	if (address !== "") {
		let contract = new node.eth.Contract(abi, address);
	} else {
		let contract = new node.eth.Contract(abi);
	}
	return contract
}

function deployContract(account, bytecode, abi, success, error) {
	let contract = new node.eth.Contract
}

// console.log(compileContract('/home/pieter/bscinf/y3/bproject/docker/chain/contracts/demand.sol', 'Demand'));
console.log(compileContract('contracts/demand.sol', 'Demand'));

let byte_codei = "0x" + fs.readFileSync('bin/Demand.bin');
let abii = JSON.parse(fs.readFileSync('bin/Demand.abi'), {encoding: "utf-8"});

console.log({
	bytecode: byte_codei,
	abi: abii
});

process.exit()
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const account_address = "0xae7fed7156e6856f65f7a1a0318ec7ce639ba94c";
const account_passphrase = "testaccount";


let byte_code = "0x" + fs.readFileSync('bin/Demand.bin');
let abi = JSON.parse(fs.readFileSync('bin/Demand.abi'), {encoding: "utf-8"});

let contract = new node.eth.Contract(abi);
console.log("about to deploy");

console.log(node.eth.personal.unlockAccount(account_address, account_passphrase));

let txobj = contract.deploy({
	data: byte_code,
	arguments: [10, 1, 10000]
});

txobj.estimateGas({gas: 10000000000000}, function (error, gasEstimate) {
	if (error) {
		console.log("gas price estimate error:");
		console.log(error);
	}
	if (gasEstimate) {
		console.log("estimated gas cost: " + gasEstimate);
	}
});

txobj.send({
	from: account_address,
	gas: 100000000000000
}, function (error, txHash) {
	console.log("general error:");
	console.log(error);
	console.log("general txHash:");
	console.log(txHash);
}).on('error', function (error) {
	console.log("error error:");
	console.log(error);
}).on('transactionHash', function (txHash) {
	console.log("txHash txHash:");
	console.log(txHash);
}).on('receipt', function(receipt){
	console.log("receipt receipt:")
	console.log(receipt.contractAddress) // contains the new contract address
 }).on('confirmation', function(confirmationNumber, receipt) {
	 if (confirmationNumber > 0) {
		 process.exit();
	 }
	console.log("confirmation confirmationNumber:")
	console.log(confirmationNumber);
	console.log("confirmation receipt");
	console.log(receipt);
 }).then(function(newContractInstance){
	console.log("newContractInstance newContractInstance");
	console.log(newContractInstance.options.address); // instance with the new contract address
	newContractInstance.methods['getName']().call({from: account_address}, function(error, result) {
		if (error) {
			console.log("getName failed");
			console.log(error);
		}
		if (result) {
			console.log(result);
		}
	});

	newContractInstance.methods.testReachability().call({from: account_address}, function(error, result) {
		if (error) {
			console.log("testReachability failed");
			console.log(error);
		}
		if (result) {
			console.log(result);
		}
	});
 });