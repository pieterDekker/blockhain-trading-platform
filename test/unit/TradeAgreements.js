const Leadership = artifacts.require('Leadership');
const PaymentAgreements = artifacts.require('PaymentAgreements')
const Registry = artifacts.require('Registry')
const TradeAgreements = artifacts.require('TradeAgreements')
const Traders = artifacts.require('Traders');

const {
  expectEvent,
  expectRevert
} = require('@openzeppelin/test-helpers');

contract("TradeAgreements", async accounts => {
  let tradeAgreements;
  let sender = accounts[0];
  let offerOwner = accounts[1];
  let demandOwner = accounts[2];
  let offerPath = "abcdef";
  let demandPath = "hijklm";
  let volume = 10;
  let unitPrice = 20;

  beforeEach(async () => {
    let leadership = await Leadership.new();
    let traders = await Traders.new();
    await traders.newTrader("sender", {from: sender});
    await traders.newTrader("offerOwner", {from: offerOwner});
    await traders.newTrader("demandOwner", {from: demandOwner});
    
    let paymentAgreements = await PaymentAgreements.new(true, false);
    tradeAgreements = await TradeAgreements.new(true, false);
    
    let registry = await Registry.new(
      leadership.address, 
      '0x0000000000000000000000000000000000000000', // Marketplace
      paymentAgreements.address, 
      tradeAgreements.address, 
      traders.address
    );
    paymentAgreements.initialize(registry.address);
    tradeAgreements.initialize(registry.address);
  });

  it("Should emit a NewTradeAgreement event when a trade agreement is published", async () => {
    let receipt = await tradeAgreements.create(
      offerOwner,
      web3.utils.asciiToHex(offerPath),
      demandOwner,
      web3.utils.asciiToHex(demandPath),
      volume,
      unitPrice
    );

    expectEvent(receipt, "NewTradeAgreement", {offerOwner: offerOwner, demandOwner: demandOwner});
  });

  it("Should return the requested trade agreement", async () => {
    await tradeAgreements.create(
      offerOwner,
      web3.utils.asciiToHex(offerPath),
      demandOwner,
      web3.utils.asciiToHex(demandPath),
      volume,
      unitPrice
    );

    let match = await tradeAgreements.get(0);

    expect(match).to.have.property("offerOwner", offerOwner);
    expect(match).to.have.property("offerPath", web3.utils.asciiToHex(offerPath));
    expect(match).to.have.property("demandOwner", demandOwner);
    expect(match).to.have.property("demandPath", web3.utils.asciiToHex(demandPath));
    expect(match).to.have.property("volumeGoal", volume.toString(10));
    expect(match).to.have.property("volumeClaimed", "0");
    expect(match).to.have.property("volumeActual", "0");
    expect(match).to.have.property("unitPrice", unitPrice.toString(10));
    expect(match).to.have.property("agreementCreated", false);
  });

  it("Should only allow claiming by the offer owner", async () => {
    await tradeAgreements.create(
      offerOwner,
      web3.utils.asciiToHex(offerPath),
      demandOwner,
      web3.utils.asciiToHex(demandPath),
      volume,
      unitPrice
    );

    await expectRevert(tradeAgreements.claimVolume(0, 10, {from: demandOwner}), "Only the owner of the offer can claim a volume");
    await tradeAgreements.claimVolume(0, 10, {from: offerOwner});
  });

  it("Should only allow confirming by the demand owner", async () => {
    await tradeAgreements.create(
      offerOwner,
      web3.utils.asciiToHex(offerPath),
      demandOwner,
      web3.utils.asciiToHex(demandPath),
      volume,
      unitPrice
    );

    await tradeAgreements.claimVolume(0, 5, {from: offerOwner});
    await expectRevert(tradeAgreements.confirmVolume(0, {from: offerOwner}), "Only the owner of the demand can confirm a claim");
    await tradeAgreements.confirmVolume(0, {from: demandOwner});
  });

  it("Should create a payment agreement when the goal is reached", async () => {
    await tradeAgreements.create(
      offerOwner,
      web3.utils.asciiToHex(offerPath),
      demandOwner,
      web3.utils.asciiToHex(demandPath),
      volume,
      unitPrice
    );

    await tradeAgreements.claimVolume(0, volume, {from: offerOwner});
    let { tx } = await tradeAgreements.confirmVolume(0, {from: demandOwner});
    await expectEvent.inTransaction(tx, PaymentAgreements, "NewPaymentAgreement");
    let match = await tradeAgreements.get(0);
    expect(match).to.have.property("agreementCreated", true);
  });
});  
