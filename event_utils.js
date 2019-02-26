const typeUtils = require('./type_utils');
const nodeUtils = require('./node_utils');

let node = nodeUtils.getNode();

let account = "0x47681d90A3B1B044980c39ed1e32D160a8043Ceb";

function setAccount(_account) {
	account = _account;
}


function eventToTopicHash(eventName, argTypes) {
	if (argTypes.length < 1) {
		throw new Error("Expected at least one argument type");
	}
	let string = eventName + "(" + argTypes[0];
	for (let i = 1; i < argTypes.length; ++i) {
		string += "," + argTypes[i];
	}
	string += ")";
	return node.utils.soliditySha3(string);
}

let argumentTypes = {
	NewLeader: ['address', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256'],
	NewTradeAgreement: ['uint256', 'address', 'address'],
	VolumeClaimed: ['uint256', 'address', 'address'],
	VolumeConfirmed: ['uint256', 'address', 'address'],
	NewPaymentAgreement: ['uint256', 'address', 'address'],
	NewBid: ['uint256'],
	NewBids: ['uint256[]'],
	NewMatch: ['uint256', 'address', 'address']
};

let argumentNames = {
	NewLeader: ['leader', 'ticket', 'minUsed', 'maxUsed', 'timeStampUsed', 'difficultyUsed'],
	NewTradeAgreement: ['id', 'offerOwner', 'demandOwner'],
	VolumeClaimed: ['id', 'offerOwner', 'demandOwner'],
	VolumeConfirmed: ['id', 'offerOwner', 'demandOwner'],
	NewPaymentAgreement: ['id', 'offerOwner', 'demandOwner'],
	NewBid: ['index'],
	NewBids: ['indices'],
	NewMatch: ['index', 'offerOwner', 'demandOwner']
};

function getTopicHash(eventName) {
	return eventToTopicHash(eventName, argumentTypes[eventName]);
}

function splitData(data, numArgs) {
	let datas = [];
	data = data.substr(2,data.length-2);
	for (let i = 0; i < numArgs; ++i) {
		datas.push(data.substr(i*64, 64));
	}
	return datas;
}

function addressFromEventData(data) {
	return data.substr(data.length - 42, data.length);
}

function parse(data, type) {
	switch (type) {
		case "uint256":
			if (isNaN(parseInt(data, 16))) {
				console.log("got " + data + " as number, but is NaN");
			}
			return parseInt(data, 16);
		// case " uint256[]":
		// 	return
		case "address":
			return typeUtils.applyChecksum(addressFromEventData(data));
		default:
			throw new Error("no parse method for type '" + type + "'");
	}
}

function parseData(data, eventName) {
	let parsedData = {};
	let argTypes = argumentTypes[eventName];
	let argNames = argumentNames[eventName];
	let datas = splitData(data, argTypes.length);
	for (let i = 0; i < argTypes.length; ++i) {
		parsedData[argNames[i]] = parse(datas[i], argTypes[i])
	}
	return parsedData;
}

function handleNewTradeAgreement(event) {
	console.log("NewTradeAgreement:");
	console.log(parseData(event.data, "NewTradeAgreement"));
}

function handleVolumeClaimed(event) {
	console.log("VolumeClaimed:");
	console.log(parseData(event.data, "VolumeClaimed"));
}

function handleVolumeConfirmed(event) {
	console.log("VolumeConfirmed:");
	console.log(parseData(event.data, "VolumeConfirmed"));
}

function handleNewPaymentAgreement(event) {
	console.log("NewPaymentAgreement:");
	console.log(parseData(event.data, "NewPaymentAgreement"));
}

function handleNewLeader(event) {
	let data = parseData(event.data, "NewLeader");
	if (account === data.leader) {
		console.log("We are the leader, start mining...");
		node.miner.start();
	} else {
		console.log("We are not the leader, stop mining...");
		console.log("We are " + account);
		console.log("The leader is " + data.leader);
		node.miner.stop();
	}
}

function handleNewBid(event) {
	let data = parseData(event.data, "NewBid");
	console.log(data);
}

function handleNewBids(event) {
	console.log("NewBids");
}

function handleNewMatch(event) {
	let data = parseData(event.data, "NewMatch");
	console.log("New match between " + data.offerOwner + " and " + data.demandOwner);
}

/**
 * Maps topics to event handlers
 * @type {{}}
 */
const handlers = {};
handlers[getTopicHash("NewTradeAgreement")] = handleNewTradeAgreement;
handlers[getTopicHash("VolumeClaimed")] = handleVolumeClaimed;
handlers[getTopicHash("VolumeConfirmed")] = handleVolumeConfirmed;
handlers[getTopicHash("NewPaymentAgreement")] = handleNewPaymentAgreement;
handlers[getTopicHash("NewLeader")] = handleNewLeader;
handlers[getTopicHash("NewBid")] = handleNewBid;
handlers[getTopicHash("NewBids")] = handleNewBids;
handlers[getTopicHash("NewMatch")] = handleNewMatch;

function handleEvent(event) {
	if (event.topics[0] in handlers) {
		handlers[event.topics[0]](event);
	} else {
		console.log("No handler for topic " + event.topics[0]);
		console.log(event);
	}
}

function dataFromReceipt(receipt, eventName) {
	let receivedEvents = receipt.events;
	let rightEvent = null;
	for (let eventKey of Object.keys(receivedEvents)) {
		if (receivedEvents[eventKey].raw.topics[0] === getTopicHash(eventName)) {
			rightEvent = receivedEvents[eventKey];
		}
	}
	if (rightEvent === null) {
		return false;
	}
	return parseData(rightEvent.raw.data, eventName);
}

module.exports = {
	getTopicHash: getTopicHash,
	parseData: parseData,
	handleEvent: handleEvent,
	setAccount: setAccount,
	dataFromReceipt: dataFromReceipt
};
