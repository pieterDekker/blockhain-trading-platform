const keyth = require('keythereum');
const crypto = require('crypto');
const kp = require('keypair');
const fs = require('fs');

// function initFromAccountFile(account) {
// 	let keyobj = keyth.importFromFile(account, './private_chain/');
// 	let privateKey =
// }

function privateKeyPath(account) {
	if (account === undefined || account === null) {
		throw new Error("account required to get private key path");
	}

	return "./private_chain/keystore/" + account;
}

function publicKeyPath(account) {
	if (account === undefined || account === null) {
		throw new Error("account required to get public key path");
	}

	return "./private_chain/keystore/" + account + ".pub";
}

function encrypt(subject, passphrase) {
	let cipher = crypto.createCipher('aes-256-ctr', passphrase);
	return cipher.update(subject, 'utf8', 'hex') + cipher.final('hex');
}

function decrypt(subject, passphrase) {
	let decipher = crypto.createDecipher('aes-256-ctr', passphrase);
	return  decipher.update(subject, 'hex', 'utf8') + decipher.final('utf8');
}

function keyPairExists(account) {
	return fs.existsSync(privateKeyPath(account)) && fs.existsSync(publicKeyPath(account))
}

function newKeyPairForAccount(account, passphrase) {
	if (keyPairExists(account)) {
		throw new Error("Key pair already exists for account " + account);
	}
	let keyPair = kp();

	fs.writeFileSync(publicKeyPath(account), keyPair.public, {encoding: 'utf8'});
	fs.writeFileSync(privateKeyPath(account), keyPair.private,{encoding: 'utf8'});

	return keyPair;
}

function getKeyPairForAccount(account, passphrase) {
	if (!keyPairExists(account)) {
		throw new Error("No key pair exists for account " + account);
	}

	let keyPair = {};

	keyPair.public = fs.readFileSync(publicKeyPath(account)).toString('utf8');
	keyPair.private = fs.readFileSync(privateKeyPath(account)).toString('utf8');

	return keyPair;
}

// let keyPair = newKeyPairForAccount("0xabcde");
//
// console.log(keyPair);
//
// let keyPair2 = getKeyPairForAccount("0xabcde");
//
// console.log(keyPair2);

module.exports = {
	keyPairExists: keyPairExists,
	newKeyPairForAccount: newKeyPairForAccount,
	getKeyPairForAccount: getKeyPairForAccount
};