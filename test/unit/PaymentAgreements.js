const Leadership = artifacts.require('Leadership');
const PaymentAgreements = artifacts.require('PaymentAgreements');
const Registry = artifacts.require('Registry');
const TradeAgreements = artifacts.require('TradeAgreements');
const Traders = artifacts.require('Traders');

const {
  expectEvent,
  expectRevert
} = require('@openzeppelin/test-helpers');

contract("PaymentAgreements", async accounts => {
  let paymentAgreements;
  let sender = accounts[0];
  let offerOwner = accounts[1];
  let demandOwner = accounts[2];
  let offerPath = "abcdef";
  let demandPath = "hijklm";
  let volume = 10;
  let unitPrice = 20;
  let amount = volume * unitPrice;

  beforeEach(async () => {
    let leadership = await Leadership.new();
    traders = await Traders.new();
    await traders.newTrader("sender", {from: sender});
    await traders.newTrader("offerOwner", {from: offerOwner});
    await traders.newTrader("demandOwner", {from: demandOwner});

    paymentAgreements = await PaymentAgreements.new(true, false);
    let tradeAgreements = await TradeAgreements.new(true, false);
    let registry = await Registry.new(
      leadership.address,
      '0x0000000000000000000000000000000000000000', // Marketplace
      paymentAgreements.address, 
      sender, 
      traders.address
    );
    await paymentAgreements.initialize(registry.address);
    await tradeAgreements.initialize(registry.address);
  });

  it("Should emit a NewPaymentAgreement event when a trade agreement is published", async () => {
    let receipt = await paymentAgreements.create(
      offerOwner,
      web3.utils.asciiToHex(offerPath),
      demandOwner,
      web3.utils.asciiToHex(demandPath),
      amount
    );

    expectEvent(receipt, "NewPaymentAgreement", {offerOwner: offerOwner, demandOwner: demandOwner});
  });

  it("Should return the requested payment agreement", async () => {
    await paymentAgreements.create(
      offerOwner,
      web3.utils.asciiToHex(offerPath),
      demandOwner,
      web3.utils.asciiToHex(demandPath),
      amount
    );

    let match = await paymentAgreements.get(0);

    expect(match).to.have.property("offerOwner", offerOwner);
    expect(match).to.have.property("offerPath", web3.utils.asciiToHex(offerPath));
    expect(match).to.have.property("demandOwner", demandOwner);
    expect(match).to.have.property("demandPath", web3.utils.asciiToHex(demandPath));
    expect(match).to.have.property("amountGoal", amount.toString(10));
    expect(match).to.have.property("amountClaimed", "0");
    expect(match).to.have.property("amountActual", "0");
    expect(match).to.have.property("finished", false);
  });

  it("Should only allow claiming by the offer owner", async () => {
    await paymentAgreements.create(
      offerOwner,
      web3.utils.asciiToHex(offerPath),
      demandOwner,
      web3.utils.asciiToHex(demandPath),
      amount
    );

    await expectRevert(paymentAgreements.claimAmount(0, 10, {from: offerOwner}), "Only the owner of the demand can claim an amount");
    await paymentAgreements.claimAmount(0, 10, {from: demandOwner});
  });

  it("Should only allow confirming by the demand owner", async () => {
    await paymentAgreements.create(
      offerOwner,
      web3.utils.asciiToHex(offerPath),
      demandOwner,
      web3.utils.asciiToHex(demandPath),
      amount
    );

    await paymentAgreements.claimAmount(0, 10, {from: demandOwner});
    await expectRevert(paymentAgreements.confirmAmount(0, {from: demandOwner}), "Only the owner of the offer can confirm an amount");
    await paymentAgreements.confirmAmount(0, {from: offerOwner});
  });

  it("Should finish a payment agreement when the goal is reached", async () => {
    await paymentAgreements.create(
      offerOwner,
      web3.utils.asciiToHex(offerPath),
      demandOwner,
      web3.utils.asciiToHex(demandPath),
      amount
    );

    await paymentAgreements.claimAmount(0, amount, {from: demandOwner});
    let { tx } = await paymentAgreements.confirmAmount(0, {from: offerOwner});
    await expectEvent.inTransaction(tx, PaymentAgreements, "PaymentAgreementFinished");
    let match = await paymentAgreements.get(0);
    expect(match).to.have.property("finished", true);
  });
});
