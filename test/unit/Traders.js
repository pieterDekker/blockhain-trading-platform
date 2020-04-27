const Traders = artifacts.require('Traders');

const {
  expectRevert,
} = require('@openzeppelin/test-helpers');

contract('Traders', async accounts => {
  let instance;
  let trader1 = accounts[1];
  let trader2 = accounts[2];
  
  beforeEach(async () => {
    instance = await Traders.new()
  });

  it('should allow for new traders to be created', async () => {
    await instance.newTrader("trader1", {from: trader1});
  });

  it('should correctly report wether an account belongs to a trader', async () => {
    await instance.newTrader("Name", {from: trader1});
    let trader1IsTrader = await instance.accountHasTrader(trader1);
    let trader2IsTrader = await instance.accountHasTrader(trader2);
    expect(trader1IsTrader).to.equal(true);
    expect(trader2IsTrader).to.equal(false);
  });

  it('should return a traders name', async () => {
    let name = "Name";
    await instance.newTrader(name, {from: trader1});
    let traderName = await instance.getTraderName(trader1);
    expect(traderName).to.equal(name);
  });

  it('should not allow for a trader to be created twice', async () => {
    await instance.newTrader("Name", {from: trader1});
    await expectRevert(instance.newTrader("OtherName", {from: trader1}), "Account already has a trader");
  });
});
