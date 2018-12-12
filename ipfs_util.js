let Ipfs = require('ipfs');
let pubsub = require('pubsub-js');
let crypto = require('crypto');

/** @type {boolean} Indicates wether an ipfs node is running */
// let IPFS_UP = false;

/** @type {Ipfs} ipfs_node */
let ipfs_node = new Ipfs({repo: './ipfs'});

let publicKeys = {};

function addPublicKey(account, key) {
	if (account in publicKeys) throw new Error(account + " already has a public key registered");
	publicKeys[account] = key;
}

function getPublicKey(account) {
	if (!(account in publicKeys)) throw new Error(account + " does not yet have a public key registered");
	return publicKeys[account];
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
 * @property {Number} unit_price
 * @property {Number} volume
 * @property {Number} expires
 * @property {string} owner
 */

/**
 * @typedef {Object} IpfsBid
 * @property {Number} type
 * @property {Number} unit_price
 * @property {Number} volume
 * @property {Number} expires
 * @property {string} owner
 * @property {string} signature
 */

/**
 *
 * @param {Bid} bid
 * @return {string}
 */
function bidToSignatureString(bid) {
	return "" +
		JSON.stringify(bid.type) +
		JSON.stringify(bid.unit_price) +
		JSON.stringify(bid.volume) +
		JSON.stringify(bid.expires) +
		JSON.stringify(bid.owner);
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
 * @async
 * @param {Ipfs} ipfs
 * @param {Bid} bid
 * @param {string} privateKey
 * @param {string} [path]
 * @return {Promise<Object>}
 */
async function storeBid(ipfs, bid, privateKey, path="") {
	bid['signature'] = createBidSignature(bid, privateKey);
	return (await storeObject(ipfs, bid, path))[0];
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
 * @return {Promise<Ipfs>}
 */
async function getNode() {
	return new Promise((resolve, reject) => {
		ipfs_node.on('ready', () => {
			pubsub.publish('IPFS', "NODE_READY");
			resolve(ipfs_node);
		});
	});
}

module.exports = {
	getNode: getNode,
	addPublicKey: addPublicKey,
	getPublicKey: getPublicKey,
	storeObject: storeObject,
	retrieveObject: retrieveObject,
	storeBid: storeBid,
	retrieveBid: retrieveBid
};