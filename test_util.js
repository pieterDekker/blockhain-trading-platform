const solc = require('solc');
const byteUtils = require('./byte_utils');
/**
 * Transforms 'SomeString' to 'someString'
 * @param {String} string
 */
function upperToLowerCamelCase(string) {
	return string[0].toLowerCase() + string.substr(1);
}

/**
 * Transforms 'someString' to 'SomeString'
 * @param {String} string
 */
function lowerToUpperCamelCase(string) {
	return string[0].toUpperCase() + string.substr(1);
}

/**
 * Checks if a string is a solidity warning
 * @param {String} string
 * @return {boolean}
 */
function isWarning(string) {
	//Find the first capital 'W'
	let idx = 0;
	while (string[idx] !== "W") {
		idx++;
		if (idx >= string.length) {
			break;
		}
	}
	//See if the first capital 'W' is followed by exactly 'arning:'
	return (string.substr(idx, "Warning:".length) === "Warning:");
}

function extend(object, extension) {
	Object.keys(extension).forEach(key => {
		object[key] = extension[key];
	});
	return object;
}

/**
 * Attempt to unlock the given account with the given passphrase.
 * @param {Object} node
 * @param {string} account
 * @param {string} passphrase
 * @param {Number} duration The duration for which the account will be unlocked, in seconds
 *
 * @returns {Promise} resolves with true on success, an error string on failure.
 */
function unlockAccount(node, account, passphrase, duration = 300) {
	return node.eth.personal.unlockAccount(account, passphrase, duration);
}

/**
 * Strip fileName of '.js' extension
 * @param {string} fileName
 * @return {string}
 */
function stripJsExt(fileName) {
	if (fileName.indexOf('.js') === fileName.length - 3) {
		return fileName.substr(0,fileName.length - 3)
	}
	return fileName
}

/**
 * Strip fileName of '.sol' extension
 * @param {string} fileName
 * @return {string}
 */
function stripSolExt(fileName) {
	if (fileName.indexOf('.sol') === fileName.length - 4) {
		return fileName.substr(0,fileName.length - 4)
	}
	return fileName
}

/**
 * Boolean indicating if a compiled object has just a single contract
 * @param {Object} compiled
 * @return {boolean}
 */
function isSingleContract(compiled) {
	return Object.keys(compiled.contracts).length === 1;
}

/**
 * Construct a list of contract names without heading ':' for the given compiled object
 * @param compiled
 * @return {string[]}
 */
function getContractNames(compiled) {
	let names = Object.keys(compiled.contracts);
	for (let idx in names){
		if (names[idx].indexOf(':') === 0){
			names[idx] = names[idx].substr(1);
		}
	}
	return names;
}

/**
 * Return the name of a contract
 * @param compiled
 * @return {string}
 */
function getContractName(compiled) {
	let names = getContractNames(compiled);
	if (names.length > 1) {
		throw Error("Expected a single contract, got " + names.length);
	}
	return names[0]
}


/**
 *
 * @param file
 * @param [suppressWarnings = false]
 * @return {{abi: Object, bytecode: string}}
 */
function compileContractFromFile(file, suppressWarnings = false) {
	// console.log(file)
	let compiled = solc.compile(file, 1);
	if (Array.isArray(compiled.errors) && compiled.errors.length > 0) {
		let errors = false;
		compiled.errors.forEach(error => {
			if (isWarning(error) && !suppressWarnings || !isWarning(error)) {
				console.log(error)
			}
			if (!isWarning(error)) errors = true;
		});
		if (errors) {
			throw Error("Compilation failed, see errors above")
		}
	}
	if (!isSingleContract(compiled)) {
		throw Error("only single contract files supported")
	}
	let name = getContractName(compiled);
	let contract = compiled.contracts[':' + name];
	let abi = JSON.parse(contract.interface);

	return {
		abi: abi,
		bytecode: "0x" + contract.bytecode
	}
}

/**
 *
 * @param {Object} file
 * @param {Array.<Object>} includes
 * @return {{abi: Object, bytecode: string}}
 */
function compileContractFromFileWithIncludes(file, includes = []) {
	if (includes.length < 1) {
		throw Error("Expected at least one include, found " + includes.length);
	}

	let sources = extend(file, includes);

	let compiled = solc.compile({sources: sources}, 1);
	if (Array.isArray(compiled.errors) && compiled.errors.length > 0) {
		let errors = false;
		compiled.errors.forEach(error => {
			console.log(error);
			errors = !isWarning(error);
		});
		if (errors) {
			throw Error("Compilation failed, see errors above")
		}
	}

	let name = lowerToUpperCamelCase(stripSolExt(Object.keys(file)[0]));

	let contract = compiled.contracts[Object.keys(file)[0] + ':' + name];
	let abi = JSON.parse(contract.interface);

	return {
		abi: abi,
		bytecode: "0x" + contract.bytecode
	}
}

module.exports = {
	unlockAccount: unlockAccount,
	stripJsExt: stripJsExt,
	upperToLowerCamelCase: upperToLowerCamelCase,
	compileContractFromFile: compileContractFromFile,
	compileContractFromFileWithIncludes: compileContractFromFileWithIncludes,
	byteStringToString: byteUtils.byteStringToString,
	stringToBytes: byteUtils.stringToBytes
};