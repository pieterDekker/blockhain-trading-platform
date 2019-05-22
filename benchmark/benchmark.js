const fs = require('fs');

const marketplace = require('../marketplace');
const events = require('../events');
const node_utils = require('../node_utils');
const test_util = require('../test_util');
const web3 = require('web3');

const node = node_utils.getNode();

let benchmark_size = 10;
let account = "0x47681d90A3B1B044980c39ed1e32D160a8043Ceb";
let passphrase = "testaccount";
let gasAmount = 100000000000;

let firstBlockNumber = 0;
let lastBlockNumber = 0;

//This error should be ignored everytime
const transaction_not_mined_message = "Transaction was not mined within 50 blocks, please make sure your transaction was properly sent. Be aware that it might still be mined!";

async function runBenchmark() {
	console.log("will perform benchmark by publishing and retrieving " + benchmark_size + " offers");

	await test_util.unlockAccount(node, account, passphrase);

	console.log("starting miner with 1 thread");
	node.miner.start(1);

	marketplace.init(account, gasAmount);

	let marketplaceFile = fs.readFileSync('/home/pieter/bscinf/y3/bproject/docker/chain/contracts/marketplace.sol').toString();
	let marketplaceCompiled = test_util.compileContractFromFile(marketplaceFile, true);
	let marketplaceContract =
		await (new node.eth.Contract(marketplaceCompiled.abi))
			.deploy({data: marketplaceCompiled.bytecode})
			.send({from: account, gas: gasAmount, gasPrice: web3.utils.toWei("1", 'wei')});

	let timeout_handle;
	let timeout_length = 60000;

	events.on("NewBid", (event, rawEvent) => {
		if (firstBlockNumber === 0) {
			firstBlockNumber = rawEvent.blockNumber;
		}
		lastBlockNumber = rawEvent.blockNumber;
		clearTimeout(timeout_handle);
		marketplace.getBid(marketplaceContract, event.index)
			.then((published) => {
				publishedOffers.push(published);
				if (publishedOffers.length === benchmark_size) {
					report(offers, publishedOffers, start);
				} else {
					timeout_handle = setTimeout(() => {
						console.log((timeout_length / 1000) + " seconds passed since last bid was received");
						report(offers, publishedOffers, start)
					}, timeout_length);
				}
			})
			.catch((error) => {
				if (error.message !== transaction_not_mined_message) {
					console.error("Unexpected error occurred while getting offer: " + error.message);
					console.error(error);
				}
			})
	});

	let offers = [];
	for (let i = 0; i < benchmark_size; i++) {
		offers.push(marketplace.newBidObject(0, i, 1,0, account));
	}

	const start = Date.now();

	let publishedOffers = [];

	for (let offer of offers) {
		marketplace.publishBid(marketplaceContract, offer)
			.catch((err) => {
				if (err.message !== transaction_not_mined_message) {
					console.error("An error occurred while publishing an offer: " + err.message);
					console.error(err);
				}
			});
	}
}

function report(offers, publishedOffers, start) {
	const stop = Date.now();
	let found = 0;

	for (let offer of offers) {
		for (let published of publishedOffers) {
			if (offer.signature === published.signature) {
				found++;
			}
		}
	}

	if (found === benchmark_size) {
		console.log(benchmark_size + " offers published and retrieved in " + ((stop - start) / 1000) + " seconds.");
		node.miner.stop();
		process.exit(0);
	}

	console.log("Runtime: " + ((stop - start) / 1000) + " seconds.");
	console.log(found + " out of " + benchmark_size + " offers published and retrieved between block " + firstBlockNumber + " and " + lastBlockNumber);
	node.miner.stop();
	process.exit(0);
}

const args = process.argv.slice(2);

if (args.length === 0) {
	console.log("No benchmark test size specified, continuing with default size " + benchmark_size);
} else if (isNaN(Number(args[0]))) {
	console.error("The first argument should be a number, found: " + args[0]);
	console.error("Exiting");
	process.exit(-1);
} else {
	benchmark_size = Number(args[0]);
}

runBenchmark()
.catch((err) => {
	console.error("An error occurred during the benchmark: " + err.message);
	console.error(err);
	node.miner.stop();
	process.exit(-1);
});