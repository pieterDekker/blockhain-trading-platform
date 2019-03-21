const fs = require('fs');
const solc = require('solc');

const nodeUtils = require('../node_utils');
const testUtils = require('../test_util');

const node = nodeUtils.getNode();

const testAccount = "0x47681d90A3B1B044980c39ed1e32D160a8043Ceb";
const testPassword = "testaccount";
let gasAmount = 100000000000;

/**
 * @typedef {Object} Deployed
 * @property {String} fileName
 * @property {String} file
 * @property {String} contract
 */

function getContract(abi) {
	return new node.eth.Contract(abi);
}

async function deploy(contract, byteCode, arguments, account, gasAmount) {
	return await contract.deploy({data: byteCode, arguments: arguments}).send({from: account, gas: gasAmount});
}

async function deployCompiled(compiled, account, gasAmount, arguments = []) {
	let contract = getContract(JSON.parse(compiled.interface));
	return await deploy(contract, "0x" + compiled.bytecode, arguments, account, gasAmount);
}

function getCompiledByName(compilationOutput, name) {
	return compilationOutput.contracts[testUtils.upperToLowerCamelCase(name) + ".sol:" + name];
}

async function deployContracts(account, passPhrase, gasAmount) {
	await testUtils.unlockAccount(node, testAccount, testPassword);

	node.miner.start(1);

	let contractFilenames = fs.readdirSync('../contracts').filter((file) => file.endsWith(".sol"));
	let fullFiles = {};
	for (let fileName of contractFilenames) {
		fullFiles[fileName] = fs.readFileSync('../contracts/' + fileName).toString();
	}

	let compiled = solc.compile({sources: fullFiles}, 1);
	if (Array.isArray(compiled.errors) && compiled.errors.length > 0) {
		console.log("There were errors in compilation of the contracts");
		compiled.errors.map((err) => console.log(err));
	}

	let marketplace = await deployCompiled(getCompiledByName(compiled, 'Marketplace'), account, gasAmount);
	let paymentAgreements = await deployCompiled(getCompiledByName(compiled, 'PaymentAgreements'), account, gasAmount);
	let tradeAgreements = await deployCompiled(getCompiledByName(compiled, 'TradeAgreements'), account, gasAmount, [paymentAgreements._address]);
	let matches = await deployCompiled(getCompiledByName(compiled, 'Matches'), account, gasAmount, [tradeAgreements._address]);

	return {
		marketplace: marketplace,
		paymentAgreements: paymentAgreements,
		tradeAgreements: tradeAgreements,
		matches: matches
	};
}

deployContracts(testAccount, testPassword, gasAmount)
	.then((contracts) =>{
		console.log("contracts deployed");
		console.log(Object.keys(contracts));
		for (let contract in contracts) {
			console.log(contract + " is at " + contracts[contract]._address);
		}
		node.miner.stop();
		process.exit(0);
	})
	.catch((error) => {
		console.log("Error in deployContracts: " + error.message);
		console.log(error);
		node.miner.stop();
		process.exit(-1);
	});

module.exports = {
	deployContracts: deployContracts
};