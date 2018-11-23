const Web3 = require('web3');
const w3u = (new Web3()).utils;
const util = require('../test_util');

let fileName = 'bids.sol';

let includes = [];

let constructor_arguments = [];

let account = "";

let gasAmount;

/**
 * @type expectCallback
 * @callback expectCallback
 * @param {String} fileName
 * @param {String} functionName
 * @param {Number} num_assertions
 */
let expect_f = undefined;

/**
 * @type failCallback
 * @callback failCallback
 * @param {String} fileName
 * @param {String} functionName
 * @param {String} Message
 */
let fail_f = undefined;

/**
 * @type passCallback
 * @callback passCallback
 * @param {String} fileName
 * @param {String} functionName
 * @param {String} message
 */
let pass_f = undefined;

/**
 * @type errorCallback
 * @callback errorCallback
 * @param {String} fileName
 * @param {String} functionName
 * @param {Object} error
 */
let error_f = undefined;

/**
 *
 * @param {boolean} cond
 * @param {String} function_name
 * @param {String} message
 */
function assertTrue(cond, function_name, message) {
    if (cond) {
        pass_f(fileName, function_name, message);
    } else {
        fail_f(fileName, function_name, message);
    }
}

/**
 * Set the account address to be used in transactions
 *
 * @param {String} _account
 */
function setAccount (_account) {
    account = _account;
}

/**
 * Set the maximum gas amount to be used in transactions
 *
 * @param {Number} _gasAmount
 */
function setGasAmount(_gasAmount) {
    gasAmount = _gasAmount;
}

/**
 * Set the expect callback to the appropriate function
 * @param {expectCallback} callback
 */
function setExpect(callback) {
    expect_f = callback;
}

/**
 * Set the fail callback to the appropriate function
 * @param {failCallback} callback
 */
function setFail(callback) {
    fail_f = callback;
}

/**
 * Set the pass callback to the appropriate function
 * @param {passCallback} callback
 */
function setPass(callback) {
    pass_f = callback;
}

/**
 * Set the error callback to the appropriate function
 * @param {errorCallback} callback
 */
function setError(callback) {
    error_f = callback;
}

/**
 * @param {Eth.Contract} contract
 */
function testGetName(contract) {
    let fn = "getName";
    expect_f(fileName, fn, 1);
    contract.methods.getName().call()
        .then(name => {
            assertTrue(name === "Bids", fn, "Name should be \"Bids\"");
        })
        .catch(error => {
            error_f(fileName, fn, error)
        });
}

function testGetLauncher(contract) {
	let fn = "getLauncher";
	expect_f(fileName, fn, 1);
	contract.methods.getLauncher().call()
		.then(launcher => {
			assertTrue(launcher === account, fn, "Launcher should be " + account + " is " + launcher);
		})
		.catch(error => {
			error_f(error);
		});
}

function testNewBid(contract) {
	let fn = "newBid";
	expect_f(fileName, fn, 6);

	const ipfs = require('../ipfs-util');
	ipfs.getNode()
		.then(async (ipfs_node) => {
			let bid = {
				type : 0,
				unit_price : 1,
				volume : 2,
				expires : 3
			};

			let ipfs_file = await ipfs.storeObject(ipfs_node, bid);
			let ipfs_file_id_bytes = util.stringToBytes(ipfs_file[0].path);

			contract.methods.newBid(ipfs_file_id_bytes, bid.type, bid.unit_price, bid.volume, bid.expires).send({from: account, gas: gasAmount})
				.then(async (receipt) => {
					pass_f(fileName, fn, "newBid receipt");
					contract.methods.getBid(receipt.events.NewBid.returnValues.index).call()
						.then(async returns => {
							let getBid_ipfs_file_id = util.byteStringToString(returns.ipfs_file_id);
							assertTrue(getBid_ipfs_file_id === ipfs_file[0].path, fn, "ipfs file id should be " + ipfs_file[0].path + ", is " + getBid_ipfs_file_id);

							let retrieved_bid = (await ipfs.retrieveObject(ipfs_node, getBid_ipfs_file_id))[0];
							assertTrue(retrieved_bid.type === bid.type, fn, "retrieved bid type should be " + bid.type + ", is " + retrieved_bid.type);
							assertTrue(retrieved_bid.unit_price === bid.unit_price, fn, "retrieved bid type should be " + bid.unit_price + ", is " + retrieved_bid.unit_price);
							assertTrue(retrieved_bid.volume === bid.volume, fn, "retrieved bid type should be " + bid.volume + ", is " + retrieved_bid.volume);
							assertTrue(retrieved_bid.expires === bid.expires, fn, "retrieved bid type should be " + bid.expires + ", is " + retrieved_bid.expires);
							ipfs_node.stop();
						})
						.catch(error => {
							ipfs_node.stop();
							error_f(fileName, fn, error);
						})
				})
				.catch(error => {
					error_f(fileName, fn, error);
					ipfs_node.stop();
				});
		})


}

module.exports = {
    constructor_arguments: constructor_arguments,
    fileName: fileName,
    includes: includes,
    setFail: setFail,
    setPass: setPass,
    setExpect: setExpect,
    setError: setError,
    setAccount: setAccount,
    setGasAmount: setGasAmount,
	testGetName: testGetName,
    testGetLauncher: testGetLauncher,
    testNewBid: testNewBid
};