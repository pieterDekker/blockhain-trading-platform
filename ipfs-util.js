let Ipfs = require('ipfs');
let pubsub = require('pubsub-js');

/** @type {boolean} Indicates wether an ipfs node is running */
// let IPFS_UP = false;

/** @type {IPFS} ipfs_node */
let ipfs_node = new Ipfs({repo: './ipfs'});

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
 *
 * @param {Object} obj
 * @param {string} [path]
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
	storeObject: storeObject,
	retrieveObject: retrieveObject
};