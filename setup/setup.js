const nodeUtils = require('../node_utils');
const testUtils = require('../test_util');
const fs = require('fs');
const node = nodeUtils.getNode();

const testAccount = "0x47681d90A3B1B044980c39ed1e32D160a8043Ceb";
const testPassword = "testaccount";
let gasAmount = 100000000000;

/**
 * @typedef {Object} IncludeComposite
 * @property {String} fileName
 * @property {String} file
 * @property {String} contract
 */

/**
 * @param fileName
 * @param includeComposites
 */

async function getContract(fileName, includeComposites) {
	let file = fs.readFileSync('../contracts/' + fileName).toString();
	let compiled;
	let arguments = [];

	if (includes.length < 1) {
		compiled = testUtils.compileContractFromFile(file);
	} else {
		let includes = {};
		for (let includeComposite of includeComposites) {
			includes[includeComposite.fileName] = includeComposite.file;
			arguments.push(includeComposite.contract._address);
		}
		compiled = testUtils.compileContractFromFileWithIncludes(file, includes);
	}

	


}

async function deployContracts(account, passPhrase, gasAmount) {
	await testUtils.unlockAccount(node, testAccount, testPassword);

	node.miner.start(1);

	let marketplaceFile = fs.readFileSync('../contracts/marketplace.sol').toString();
	let marketplaceCompiled = testUtils.compileContractFromFile(marketplaceFile);
	let marketplaceContract =
		await (new node.eth.Contract(marketplaceCompiled.abi))
			.deploy({data: marketplaceCompiled.bytecode})
			.send({from: account, gas: gasAmount});

	let paymentAgreementsFile = fs.readFileSync('../contracts/paymentAgreements.sol').toString();
	let paymentAgreementsCompiled = testUtils.compileContractFromFile(paymentAgreementsFile);
	let paymentAgreementsContract =
		await (new node.eth.Contract(paymentAgreementsCompiled.abi))
			.deploy({data: paymentAgreementsCompiled.bytecode})
			.send({from: account, gas: gasAmount});

	let tradeAgreementsFile = fs.readFileSync('../contracts/tradeAgreements.sol').toString();
	let tradeAgreementsCompiled = testUtils.compileContractFromFileWithIncludes({'tradeAgreements.sol': tradeAgreementsFile}, {'paymentAgreements.sol': paymentAgreementsFile});
	let tradeAgreementsContract =
		await (new node.eth.Contract(tradeAgreementsCompiled.abi))
			.deploy({data: tradeAgreementsCompiled.bytecode, arguments: [paymentAgreementsContract._address]})
			.send({from: account, gas: gasAmount});

	return
}

deployContracts(testAccount, testPassword, gasAmount)
	.then((contracts) =>{
		console.log("contracts deployed");
		node.miner.stop();
		process.exit(0);
	})
	.catch((error) => {
		console.log("Error in deployContracts: " + error.message);
		node.miner.stop();
		process.exit(-1);
	});
