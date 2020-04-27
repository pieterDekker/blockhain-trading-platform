const Leadership = artifacts.require('Leadership');
const Marketplace = artifacts.require('Marketplace');
const Matches = artifacts.require('Matches')
const PaymentAgreements = artifacts.require('PaymentAgreements')
const Registry = artifacts.require('Registry')
const TradeAgreements = artifacts.require('TradeAgreements')
const Traders = artifacts.require('Traders');

const {
  expectEvent,
  expectRevert
} = require('@openzeppelin/test-helpers');

contract("Matches", async accounts => {
  let matches;
  let marketplace;
  let sender = accounts[0];
  let offerOwner = accounts[1];
  let demandOwner = accounts[2];
  let offerPath = "abcdef"; 
  let demandPath = "hijklm";
  let volume = 10;
  let unitPrice = 20;
  let traders;

  beforeEach(async () => {
    let leadership = await Leadership.new();
    traders = await Traders.new();
    await traders.newTrader("sender", {from: sender});
    await traders.newTrader("offerOwner", {from: offerOwner});
    await traders.newTrader("demandOwner", {from: demandOwner});

    marketplace = await Marketplace.new(true, false);
    let paymentAgreements = await PaymentAgreements.new(true, false);
    let tradeAgreements = await TradeAgreements.new(true, false);
    matches = await Matches.new(true, false);

    let registry = await Registry.new(
      leadership.address,
      marketplace.address,
      paymentAgreements.address,
      tradeAgreements.address,
      traders.address
    );
    await marketplace.initialize(registry.address);
    await matches.initialize(registry.address);
    await paymentAgreements.initialize(registry.address);
    await tradeAgreements.initialize(registry.address);
  });

  it.skip("Should emit a NewMatch event when a match is published", async () => {
    let receipt = await matches.publish(
      offerOwner,
      web3.utils.asciiToHex(offerPath),
      demandOwner,
      web3.utils.asciiToHex(demandPath),
      volume,
      unitPrice
    );

    expectEvent(receipt, "NewMatch", {offerOwner: offerOwner, demandOwner: demandOwner});
  });

  it.skip("Should return the requested match", async () => {
    await matches.publish(
      offerOwner,
      web3.utils.asciiToHex(offerPath),
      demandOwner,
      web3.utils.asciiToHex(demandPath),
      volume,
      unitPrice
    );

    let match = await matches.get(0);

    expect(match).to.have.property("offerOwner", offerOwner);
    expect(match).to.have.property("offerPath", web3.utils.asciiToHex(offerPath));
    expect(match).to.have.property("demandOwner", demandOwner);
    expect(match).to.have.property("demandPath", web3.utils.asciiToHex(demandPath));
    expect(match).to.have.property("unitPrice", unitPrice.toString(10));
    expect(match).to.have.property("agreementCreated", false);
    expect(match).to.have.property("demandOwnerAccepted", false);
    expect(match).to.have.property("offerOwnerAccepted", false);
  });

  it.skip("Should not allow accepting by non owner", async () => {
    await matches.publish(
      offerOwner,
      web3.utils.asciiToHex(offerPath),
      demandOwner,
      web3.utils.asciiToHex(demandPath),
      volume,
      unitPrice
    );

    await expectRevert(matches.acceptOffer(0, {from: offerOwner}), "Only the owner of a demand can accept an offer")
    await expectRevert(matches.acceptDemand(0, {from: demandOwner}), "Only the owner of an offer can accept an demand")
  });

  it.skip("Should allow accepting by owner", async () => {
    await matches.publish(
      offerOwner,
      web3.utils.asciiToHex(offerPath),
      demandOwner,
      web3.utils.asciiToHex(demandPath),
      volume,
      unitPrice
    );

    await matches.acceptOffer(0, {from: demandOwner});
    await matches.acceptDemand(0, {from: offerOwner});
  });

  it.skip("Should create a trade agreement when the offer owner accepts after the demand owner accepted", async () => {
    await matches.publish(
      offerOwner,
      web3.utils.asciiToHex(offerPath),
      demandOwner,
      web3.utils.asciiToHex(demandPath),
      volume,
      unitPrice
    );

    await matches.acceptOffer(0, {from: demandOwner});
    let { tx } = await matches.acceptDemand(0, {from: offerOwner});
    await expectEvent.inTransaction(tx, TradeAgreements, "NewTradeAgreement");
  });

  it.skip("Should create a trade agreement when the demand owner accepts after the offer owner accepted", async () => {
    await matches.publish(
      offerOwner,
      web3.utils.asciiToHex(offerPath),
      demandOwner,
      web3.utils.asciiToHex(demandPath),
      volume,
      unitPrice
    );

    await matches.acceptDemand(0, {from: offerOwner});
    let { tx } = await matches.acceptOffer(0, {from: demandOwner});
    await expectEvent.inTransaction(tx, TradeAgreements, "NewTradeAgreement");
  });

  it.skip('should publish new matches when a round ends', async () => {
    let nMatches = 3;
    let volumes = ['100', '200', '300'];
    let unitPrices = ['10', '20', '30'];
    let matchesToPublish = [];
    for (let i = 0; i < nMatches; i++) {
      matchesToPublish.push({
        offerOwner: offerOwner,
        offerPath: web3.utils.asciiToHex(offerPath + i),
        demandOwner: demandOwner,
        demandPath: web3.utils.asciiToHex(demandPath + i),
        volume: volumes[i],
        unitPrice: unitPrices[i]
      })
    }
    
    await matches.newRound(matchesToPublish);

    for (let i = 0; i < nMatches; i++) {
      let match = await matches.get(i);
      expect(match).to.have.property("offerOwner", matchesToPublish[i].offerOwner);
      expect(match).to.have.property("offerPath", matchesToPublish[i].offerPath);
      expect(match).to.have.property("demandOwner", matchesToPublish[i].demandOwner);
      expect(match).to.have.property("demandPath", matchesToPublish[i].demandPath);
      expect(match).to.have.property("unitPrice", matchesToPublish[i].unitPrice);
      expect(match).to.have.property("agreementCreated", false);
      expect(match).to.have.property("demandOwnerAccepted", false);
      expect(match).to.have.property("offerOwnerAccepted", false);
    }
  });

  it('should cause Marketplace to reset when a round ends', async () => {
    await marketplace.publishOffer(web3.utils.asciiToHex(offerPath));
    await marketplace.publishDemand(web3.utils.asciiToHex(demandPath));

    await matches.newRound([]);

    expect(await marketplace.getCurrentOffersAmount()).to.eql(web3.utils.toBN(0));
    expect(await marketplace.getCurrentDemandsAmount()).to.eql(web3.utils.toBN(0));
  });
});  
