const nodeUtils = require('./node_utils');
const ipfsUtils = require('./ipfs_util');
const byteUtils = require('./byte_utils');
const web3 = require('web3');

let initialized = false;

let account = "";
let gasAmount = 0;
let keyPair = {private: null, public: null};

function init(_account, _gasAmount) {
	account = _account;
	gasAmount = _gasAmount;
	keyPair = ipfsUtils.getKeyPair(account);
	initialized = true;
}

function checkInitialized() {
	if (!initialized) throw new Error("Bids utilities used before initialized");
}

function bidsAreEqual(bidA, bidB) {
	if (bidA.type !== bidB.type) return false;
	if (bidA.volume !== bidB.volume) return false;
	if (bidA.unit_price !== bidB.unit_price) return false;
	if (bidA.expires !== bidB.expires) return false;
	return bidA.owner === bidB.owner;
}

function newBidObject(type, volume, unit_price, expires, owner) {
	return {
		type: type,
		volume: volume,
		unit_price: unit_price,
		expires: expires,
		owner: owner
	}
}

async function getBidPath(contract, id) {
	checkInitialized();
	let pathBytes = await contract.methods.getBid(id).call();
	let path = byteUtils.byteStringToString(pathBytes);
	return path;
}

async function getBid(contract, id) {
	checkInitialized();
	const ipfsNode = await ipfsUtils.getNode();
	let path = await getBidPath(contract, id);
	let bid = await ipfsUtils.retrieveBid(ipfsNode, path);
	bid.unit_price = Number(bid.unit_price);
	bid.volume = Number(bid.volume);
	bid.expires = Number(bid.expires);
	return bid;
}

async function getBids(contract) {
	checkInitialized();
	const ipfsNode = await ipfsUtils.getNode();
	let pathsBytes = await contract.methods.getBids().call();
	let bids = [];
	for (let path of pathsBytes.map(pathBytes => byteUtils.byteStringToString(pathBytes))) {
		bids.push(await ipfsUtils.retrieveBid(ipfsNode, path));
	}
	return bids;
}

async function publishBid(contract, obj) {
	checkInitialized();
	const ipfsNode = await ipfsUtils.getNode();
	let path = await ipfsUtils.storeBid(ipfsNode, obj, keyPair.private);
	let pathBytes = byteUtils.stringToBytes(path);
	let receipt = await contract.methods.newBid(pathBytes).send({from: account, gas: gasAmount, gasPrice: web3.utils.toWei("1", 'wei')});
	return receipt.events.NewBid.returnValues.index;
}

async function publishBids(contract, objs) {
	checkInitialized();
	const ipfsNode = await ipfsUtils.getNode();
	let pathsBytes = [];
	for (let obj of objs) {
		pathsBytes.push(byteUtils.stringToBytes(await ipfsUtils.storeBid(ipfsNode, obj, keyPair.private)));
	}
	let receipt = await contract.methods.newBids(pathsBytes).send({from: account, gas: gasAmount});
	// console.log(receipt);
	return receipt.events.NewBids.returnValues.indices;
}

module.exports = {
	init: init,
	bidsAreEqual: bidsAreEqual,
	newBidObject: newBidObject,
	getBidPath: getBidPath,
	getBid: getBid,
	getBids: getBids,
	publishBid: publishBid,
	publishBids: publishBids
};