
/**
 *
 * @param {String} byte_string
 */
function byteStringToString(byte_string) {
	if (byte_string.indexOf("0x") !== 0) {
		throw Error("Bytestring expected to start with '0x' (" + byte_string + ")");
	}

	let string = "";
	for (let i = 2; i < byte_string.length; i += 2) {
		string += String.fromCharCode(parseInt(byte_string.substr(i,2), 16));
	}
	return string;
}

function stringToBytes (string) {
	let buffer = Buffer.from(string, 'ascii');
	let bytes = [];
	for (let i = 0; i < buffer.length; ++i) {
		bytes.push(buffer[i]);
	}
	return bytes;
}

module.exports = {
	byteStringToString: byteStringToString,
	stringToBytes: stringToBytes
};