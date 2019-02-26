function typeFromNumber(num) {
	switch (num) {
		case 0:
			return 'offer';
		case 1:
			return 'demand';

	}
}

function prepareBids(bids) {
	for (let bid of bids) {
		bid.type = typeFromNumber(bid.type);
		bid.minQuantity = bid.volume;
		bid.maxQuantity = bid.volume;
		bid.address = bid.path;
	}
	return bids;
}

function addressInMatch(address, match) {
	return (match.offerOwner === address || math.demandOwner === address)
}

function isOfferOwner(address, match) {
	return match.offerOwner === address;
}

function isDemandOwner(address, match) {
	return match.demandOwner === address;
}

function getUsedUnused(bids, matches) {
	let matchedPaths = {};

	for (let match of matches) {
		matchedPaths[match.demandPath] = true;
		matchedPaths[match.offerPath] = true;
	}
	let unused = [];
	let used = [];
	for (bid of bids) if (bid.path in matchedPaths) used.push(bid); else unused.push(bid);
	return {
		unused: unused,
		used: used
	}
}

function getUsed (bids, matches) {
	return getUsedUnused(bids, matches).used;
}

function getUnused (bids, matches) {
	return getUsedUnused(bids, matches).unused;
}

module.exports = {
	prepareBids: prepareBids,
	getUsedUnused: getUsedUnused,
	getUsed: getUsed,
	getUnused: getUnused
};