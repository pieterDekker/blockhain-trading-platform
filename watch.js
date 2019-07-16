const eventUtils = require('./event_utils');
const nodeUtils = require('./node_utils');

let node = nodeUtils.getNode();

function test() {
	let transactionsTotal = 0;

	node.eth.subscribe("newBlockHeaders")
		.on("data", (receipt) => {
			node.eth.getBlock(receipt.number).then((block) => {
				if (block.transactions.length > 0) {
					transactionsTotal += block.transactions.length;
					// if ((transactionsTotal % 10) === 0) {
						console.log(transactionsTotal + " transactions occurred while this script was running");
					// }
				}
			});
		})
		.on("error", (error) => {
			console.log("an error occurred while subscribed to 'newBlockHeader' events: " + error.message);
		});
	console.log("block subscription set up");

	node.eth.subscribe("logs", {})
		.on("data", (event) => {
			eventUtils.handleEvent(event);
		})
		.on("error", (error) => {
			console.log("An error occurred while subscribed to 'logs' events: " + error.message);
		});
	console.log("log subscription set up");
}

test();