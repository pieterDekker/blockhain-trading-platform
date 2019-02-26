let Ipfs = require('ipfs');
let pubsub = require('pubsub-js');
let crypto = require('crypto');
let chalk = require('chalk');
let keyUtils = require('./key_utils');

let account = "";

/** @type {boolean} Indicates wether an ipfs node is running */
// let IPFS_UP = false;

pubsub.subscribe("IPFS", (message, data) => {
	// console.log(chalk.blue("IPFS message: ") + message + " " + data);
	if (data === 'NODE_READY') {
		// console.log(chalk.blue("Ipfs node ready"));
	}
});

/** @type {Ipfs} ipfs_node */
let ipfs_node = new Ipfs({repo: './ipfs'});

ipfs_node.on('init', () => {
	console.log(chalk.magenta("INFO: IPFS init"));
});

ipfs_node.on('start', () => {
	console.log(chalk.magenta("INFO: IPFS start"));
});

let isReady = false;
ipfs_node.on('ready', () => {
	isReady = true;
	console.log(chalk.magenta("INFO: IPFS ready"));
});

ipfs_node.on('stop', () => {
	console.log(chalk.magenta("INFO: IPFS stop"));
});

let publicKeys = {};

let privateKey = "";

function addPublicKey(account, key) {
	if (account in publicKeys) throw new Error(account + " already has a public key registered");
	publicKeys[account] = key;
}

function getPublicKey(account) {
	if (!(account in publicKeys)) {
		console.log(publicKeys);
		console.log(account);
		throw new Error(account + " does not yet have a public key registered");
	}
	return publicKeys[account];
}

function setPrivateKey(key) {
	privateKey = key;
}

function getPrivateKey() {
	return privateKey;
}

function setAccount(_account) {
	account = _account;
	let keyPair;
	if (!keyUtils.keyPairExists(account)) {
		keyPair = keyUtils.newKeyPairForAccount(account);
	} else {
		keyPair = keyUtils.getKeyPairForAccount(account);
	}
	addPublicKey(account, keyPair.public);
	setPrivateKey(keyPair.private);
}

function getKeyPair(_account) {
	if (account !== _account) {
		throw new Error(_account + " is not set as account for ipfs utils");
	}
	let keyPair = {};
	keyPair.public = getPublicKey(_account);
	keyPair.private = getPrivateKey(_account);

	return keyPair;
}

/**
 *
 * @param {Object} obj
 *
 * @returns {Object}
 */
function cleanObject(obj) {
	let cleanObj = {};

	Object.keys(obj).forEach(key => {
		if (!(key instanceof Function)) {
			cleanObj[key] = obj[key];
		}
	});

	return cleanObj
}

/**
 * @async
 * @param {Ipfs} ipfs
 * @param {Object} obj
 * @param {string} [path]
 * @return {Promise<Object[]>}
 */
async function storeObject(ipfs, obj, path="") {
	let cleanObj = cleanObject(obj);
	let ostr = JSON.stringify(cleanObj);
	let obuf = ipfs.types.Buffer.from(ostr);

	if (path !== "") {
		return ipfs.files.add({
			path: path,
			data: obuf
		});
	}

	return ipfs.files.add(obuf);
}

/**
 * @async
 * @param {Ipfs} ipfs
 * @param {string} ipfsPath
 * @return {Promise<Object[]>}
 */
async function retrieveObject(ipfs, ipfsPath) {
	return new Promise((resolve, reject) => {
		ipfs.files.get(ipfsPath, (error, files) => {
			if (error) {
				reject(error);
			}
			let objects = [];
			files.forEach(file => {
				let objJsonStr = file.content.toString();
				try {
					objects.push(JSON.parse(objJsonStr));
				} catch (error) {
					reject(error);
				}
			});

			resolve(objects);
		});

	});
}

/**
 * @typedef {Object} Bid
 * @property {Number} type
 * @property {Number} volume
 * @property {Number} unit_price
 * @property {Number} expires
 * @property {string} owner
 */

/**
 * @typedef {Object} TradeAgreement
 * @property {string} offer_owner
 * @property {string} demand_owner
 * @property {string} offer_file
 * @property {string} demand_file
 * @property {Number} volume
 * @property {Number} unit_price
 * @property {Number} end_date
 */

/**
 * @typedef {Object} IpfsBid
 * @property {Number} type
 * @property {Number} volume
 * @property {Number} unit_price
 * @property {Number} expires
 * @property {string} owner
 * @property {string} signature
 */

/**
 * @typedef {Object} IpfsTradeAgreement
 * @property {string} offerOwner
 * @property {string} demand_owner
 * @property {string} offer_file
 * @property {string} demand_file
 * @property {Number} volume
 * @property {Number} unit_price
 * @property {Number} end_date
 * @property {string} leader_signature
 */

/**
 *
 * @param {Bid} bid
 * @return {string}
 */
function bidToSignatureString(bid) {
	return "" +
		JSON.stringify(bid.type) +
		JSON.stringify(bid.volume) +
		JSON.stringify(bid.unit_price) +
		JSON.stringify(bid.expires) +
		JSON.stringify(bid.owner);
}

/**
 *
 * @param {TradeAgreement} tradeAgreement
 * @return {string}
 */
function tradeAgreementToSignatureString(tradeAgreement) {
	return "" +
		JSON.stringify(tradeAgreement.offer_owner) +
		JSON.stringify(tradeAgreement.demand_owner) +
		JSON.stringify(tradeAgreement.offer_file) +
		JSON.stringify(tradeAgreement.demand_file) +
		JSON.stringify(tradeAgreement.volume) +
		JSON.stringify(tradeAgreement.unit_price) +
		JSON.stringify(tradeAgreement.end_date);
}

/**
 *
 * @param {Bid} bid
 * @param {string} privateKey
 * @return {string}
 */
function createBidSignature(bid, privateKey) {
	let sign = crypto.createSign('SHA256');
	sign.write(bidToSignatureString(bid));
	return sign.sign(privateKey, 'base64');
}

/**
 *
 * @param {TradeAgreement} tradeAgreement
 * @param {string} privateKey
 * @return {string}
 */
function createTradeAgreementSignature(tradeAgreement, privateKey) {
    let sign = crypto.createSign('SHA256');
    sign.write(tradeAgreementToSignatureString(tradeAgreement));
    return sign.sign(privateKey, 'base64');
}


/**
 *
 * @param {IpfsBid} bidFromIPFS
 * @param publicKey
 * @return {boolean}
 */
function verifyBidSignature(bidFromIPFS, publicKey) {
	let verify = crypto.createVerify('SHA256');
	verify.update(bidToSignatureString(bidFromIPFS));
	return verify.verify(publicKey, bidFromIPFS.signature, "base64");
}

/**
 *
 * @param {IpfsTradeAgreement} tradeAgreementFromIPFS
 * @param publicKey
 * @return {boolean}
 */
function verifyTradeAgreementSignature(tradeAgreementFromIPFS, publicKey) {
    let verify = crypto.createVerify('SHA256');
    verify.update(tradeAgreementToSignatureString(tradeAgreementFromIPFS));
    return verify.verify(publicKey, tradeAgreementFromIPFS.leader_signature, "base64");
}

/**
 * @async
 * @param {Ipfs} ipfs
 * @param {Bid} bid
 * @param {string} privateKey
 * @param {string} [path]
 * @return {Promise<Object>}
 */
async function storeBid(ipfs, bid, privateKey, path="") {
	bid['signature'] = createBidSignature(bid, privateKey);
	return (await storeObject(ipfs, bid, path))[0].path;
}

/**
 *
 * @param {Ipfs} ipfs
 * @param {TradeAgreement} trade_agreement
 * @param {string} privateKey
 * @param {string} path
 * @return {Promise<Object>}
 */
async function storeTradeAgreement(ipfs, trade_agreement, privateKey, path="") {
	trade_agreement['leader_signature'] = createTradeAgreementSignature(trade_agreement, privateKey);
	return (await storeObject(ipfs, trade_agreement, path))[0];
}

/**
 *
 * @param ipfs
 * @param ipfsPath
 * @param publicKey
 * @return {Promise<Object>}
 */
async function retrieveBid(ipfs, ipfsPath, publicKey="") {
	let bidFromIPFS = (await retrieveObject(ipfs, ipfsPath))[0];
	if (publicKey === "") publicKey = getPublicKey(bidFromIPFS.owner);
	if (!verifyBidSignature(bidFromIPFS, publicKey)) {
		throw new Error("unverified bid")
	}
	return bidFromIPFS;
}

/**
 *
 * @param ipfs
 * @param ipfsPath
 * @return {Promise<Object>}
 */
async function retrieveTradeAgreement(ipfs, ipfsPath) {
	return (await retrieveObject(ipfs, ipfsPath))[0];
}

/**
 *
 * @return {Promise<Ipfs>}
 */
async function getNode() {
	return new Promise((resolve, reject) => {
		if (isReady) resolve(ipfs_node);
		ipfs_node.on('ready', () => {
			pubsub.publish('IPFS', "NODE_READY");
			isReady = true;
			resolve(ipfs_node);
		});
	});
}

setAccount("0x47681d90A3B1B044980c39ed1e32D160a8043Ceb");

module.exports = {
	getNode: getNode,
	// stopNode: stopNode,
	addPublicKey: addPublicKey,
	getPublicKey: getPublicKey,
	setPrivateKey: setPrivateKey,
	getPrivateKey: getPrivateKey,
	setAccount: setAccount,
	getKeyPair: getKeyPair,
	storeObject: storeObject,
	retrieveObject: retrieveObject,
	storeBid: storeBid,
	storeTradeAgreement: storeTradeAgreement,
	retrieveBid: retrieveBid,
	retrieveTradeAgreement: retrieveTradeAgreement,
	verifyTradeAgreementSignature: verifyTradeAgreementSignature
};