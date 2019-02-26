const Web3 = require('web3'); //For interaction with an eth node

let node = new Web3(new Web3.providers.WebsocketProvider('ws://localhost:8546'));

//Add the stop and start miner functions
node = node.extend({
	property : 'miner',
	methods : [
		{
			name: 'stop',
			call: 'miner_stop',
		},
		{
			name: 'start',
			call: 'miner_start',
			params: 1
		}
	]
});

function getNode() {
	return node;
}

module.exports = {
	getNode: getNode
};