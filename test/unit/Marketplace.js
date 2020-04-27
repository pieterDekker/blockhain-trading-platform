const Marketplace = artifacts.require('Marketplace');
const Leadership = artifacts.require('Leadership');
const Traders = artifacts.require('Traders');
const Registry = artifacts.require('Registry');

const {
  expectEvent,
} = require('@openzeppelin/test-helpers');

contract("Marketplace", async accounts => {
  let instance;
  let sender = accounts[0];
  let offerPath = "abcdefgh";
  let demandPath = "bcdefghi";

  beforeEach(async () => {
    let leadership = await Leadership.new();
    let traders = await Traders.new();
    traders.newTrader(accounts[0]);
    let registry = await Registry.new(
      leadership.address,
      '0x0000000000000000000000000000000000000000',
      '0x0000000000000000000000000000000000000000',
      '0x0000000000000000000000000000000000000000',
      traders.address
    );
    instance = await Marketplace.new(true, false);
    instance.initialize(registry.address);
  });

  it('should test that the restrictions are set properly (meta)', async () => {
    expect(await instance.senderRestrictionsEnabled()).to.be.true;
    expect(await instance.minerRestrictionsEnabled()).to.be.false;
  });

  it("should emit a NewOffer event when a offer is published", async () => {
    let offerPathBytes = web3.utils.asciiToHex(offerPath)
    let receipt = await instance.publishOffer(offerPathBytes, {from: sender});
    expectEvent(receipt, "NewOffer", {index: web3.utils.toBN(0)});
  });

  it("should emit a NewDemand event when a demand is published", async () => {
    let sentDemandPathBytes = web3.utils.asciiToHex(demandPath)
    let receipt = await instance.publishDemand(sentDemandPathBytes, {from: sender});
    expectEvent(receipt, "NewDemand", {index: web3.utils.toBN(0)});
  });

  it("should not contain any offers initially", async () => {
    let currentOffersAmount = await instance.getCurrentOffersAmount();
    expect(currentOffersAmount).to.eql(web3.utils.toBN(0))
  });

  it("should not contain any demands initially", async () => {
    let currentDemandsAmount = await instance.getCurrentDemandsAmount();
    expect(currentDemandsAmount).to.eql(web3.utils.toBN(0))
  });

  it("should report the total amount of offers published correctly", async () => {
    let nOffers = 5;
    let path = "abcdef"
    for (let i = 0; i < nOffers; i++) {
      await instance.publishOffer(web3.utils.asciiToHex(path + i), {from: sender});
    }

    let currentOffersAmount = await instance.getCurrentOffersAmount();
    expect(currentOffersAmount).to.eql(web3.utils.toBN(nOffers));
  });

  it("should report the total amount of demands published correctly", async () => {
    let nDemands = 5;
    let path = "abcdef"
    for (let i = 0; i < nDemands; i++) {
      await instance.publishDemand(web3.utils.asciiToHex(path + i), {from: sender});
    }

    let currentDemandsAmount = await instance.getCurrentDemandsAmount();
    expect(currentDemandsAmount).to.eql(web3.utils.toBN(nDemands));
  });

  it("should allow multiple offers to be uploaded", async () => {
    let offerPathBytess = [];
    let nOffers = 5;
    for (let i = 0; i < nOffers; i++) {
      offerPathBytess.push(web3.utils.asciiToHex(offerPath + i))
    }
    await instance.publishOffers(offerPathBytess, {from: sender});

    for (let i = 0; i < nOffers; i++) {
      let offer = await instance.getOffer(i);
      expect(offer).to.equal(offerPathBytess[i]);
    }
  });

  it("should allow multiple demands to be uploaded", async () => {
    let demandPathBytess = [];
    let nDemands = 5;
    for (let i = 0; i < nDemands; i++) {
      demandPathBytess.push(web3.utils.asciiToHex(demandPath + i))
    }
    await instance.publishDemands(demandPathBytess, {from: sender});
    for (let i = 0; i < nDemands; i++) {
      let offer = await instance.getDemand(i);
      expect(offer).to.equal(demandPathBytess[i]);
    }
  });

  it('should be empty after a reset', async () => {
    await instance.publishOffer(web3.utils.asciiToHex(offerPath));
    await instance.publishOffer(web3.utils.asciiToHex(demandPath));
    await instance.reset();
    let currentOffersAmount = await instance.getCurrentOffersAmount();
    expect(currentOffersAmount).to.eql(web3.utils.toBN(0));
    let currentDemandsAmount = await instance.getCurrentDemandsAmount();
    expect(currentDemandsAmount).to.eql(web3.utils.toBN(0));
  });

  it('should overwrite old offers and demands after reset', async () => {
    await instance.publishOffer(web3.utils.asciiToHex(offerPath + "old"));
    await instance.publishDemand(web3.utils.asciiToHex(demandPath + "old"));
    await instance.reset();
    await instance.publishOffer(web3.utils.asciiToHex(offerPath + "new"));
    await instance.publishDemand(web3.utils.asciiToHex(demandPath + "new"));
    expect(await instance.getOffer(0)).to.equal(web3.utils.asciiToHex(offerPath + "new"));
    expect(await instance.getDemand(0)).to.equal(web3.utils.asciiToHex(demandPath + "new"));
  });
});
