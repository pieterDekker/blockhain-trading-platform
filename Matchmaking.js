//Made by Alex Daffurn-Lewis
//Modified by Pieter Dekker to comply with JS standard across the rest of the project. No semantic changes made, only syntactic.

/*
 * This function expects an array of bids in the form:
 * [
 *   {address: address, type: type, minQuantity: minQuantity, maxQuantity: maxQuantity, price: price},
 *   ...
 * ]
 * Where type is either "offer" or "demand"
 * It will return an array of matched offers and demands in the form:
 * [
 *   {offerAddress: addressOfOffer, demandAddress: addressOfDemand, quantity: quantity, price: price},
 *   ...
 * ]
 */
module.exports = function(bids) {
	let offers = Array();
	let demands = Array();
	let matches = Array();
	let bidQuantity;
	let bidPrice;
	/*
	 * If the bid is an offer we ask them for the minimum price they will want for their goods, we then set their price range to [price, inf)
	 * If the bid is a demand we ask them for the maximum price they are willing to pay for the goods, we then set their price range to [0, price]
	 */
	for (let i = 0; i < bids.length; i++) {
		if(bids[i].type === "offer") {
			offers.push(
				{
					owner: bids[i].owner,
					path: bids[i].path,
					type: bids[i].type,
					minQuantity: bids[i].minQuantity,
					maxQuantity: bids[i].maxQuantity,
					minPrice: bids[i].unit_price,
					maxPrice: Number.MAX_SAFE_INTEGER,
					expires: bids[i].expires,
					status: "incomplete"
				}
			); //offers.push
		} else {
			demands.push(
				{
					owner: bids[i].owner,
					path: bids[i].path,
					type: bids[i].type,
					minQuantity: bids[i].minQuantity,
					maxQuantity: bids[i].maxQuantity,
					minPrice: 0,
					maxPrice: bids[i].unit_price,
					expires: bids[i].expires,
					status: "incomplete"
				}
			);//demands.push
		}
	}
	for (let i = 0; i < offers.length; i++) {
		for (let j = 0; j < demands.length; j++) {
			if(offers[i].status === "complete") {
				break;
			} else if (demands[j].status === "complete") {
				continue;
			}
			bidQuantity = calcQuantity(offers[i], demands[j]);
			bidPrice = calcPrice(offers[i], demands[j]);
			if(bidQuantity > 0 && bidPrice > 0) {
				updateStatus(offers[i]);
				updateStatus(demands[j]);
				matches.push(
					{
						offerOwner: offers[i].owner,
						offerPath: offers[i].path,
						demandOwner: demands[j].owner,
						demandPath: demands[j].path,
						volume: bidQuantity,
						unit_price: bidPrice,
						expires: offers[i].expires < demands[j].expires ? offers[i].expires : demands[j].expires
					}
				);//matches.push
			}
		}
	}
	return matches;
};

/*
 * Checks if the two ranges of both bids meet returning 0 if they don't.
 * If they do then it returns the HIGHEST value that lies in both of the ranges.
 */
function calcQuantity(offer, demand) {
	if(demand.maxQuantity < offer.minQuantity || offer.maxQuantity < demand.minQuantity) {
		return 0;
	}
	if (offer.maxQuantity < demand.maxQuantity) {
		return offer.maxQuantity;
	}
	return demand.maxQuantity;
}
/*
 * Checks if the two ranges of both bids meet returning 0 if they do not.
 * If they do then it returns the LOWEST value that lies in both of the ranges.
 */
function calcPrice(offer, demand) {
	if(demand.maxPrice < offer.minPrice || offer.maxPrice < demand.minPrice) {
		return 0;
	}
	if (offer.minPrice < demand.minPrice) {
		return demand.minPrice;
	}
	return offer.minPrice;
}

function updateStatus(bid) {
	bid.status = "complete";
}