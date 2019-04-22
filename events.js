let eventUtils = require('./event_utils');
let nodeUtils = require('./node_utils');

const node = nodeUtils.getNode();

node.eth.subscribe("logs", {})
	.on("data", (event) => {
		eventUtils.handleEvent(event);
	})
	.on("error", (error) => {
		console.log("An error occurred while subscribed to 'logs' events: " + error.message);
	});

function on(eventName, callback) {
	eventUtils.registerTopicListener(eventName, callback);
}

module.exports = {
	on: on
};

