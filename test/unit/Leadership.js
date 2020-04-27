const Leadership = artifacts.require('Leadership');

const {
  expectEvent,
  expectRevert,
  BN
} = require('@openzeppelin/test-helpers');

contract('Leadership', async accounts => {
  let instance;
  let sender = accounts[0];
  let trader1 = accounts[1];
  let trader2 = accounts[2];
  let trader3 = accounts[3];
  let traders = [trader1, trader2, trader3];

  beforeEach(async () => {
    instance = await Leadership.new();
  });

  it('should contain zero tickets initially', async () => {
    let min = await instance.getMin();
    let max = await instance.getMax();
    let tickets = await instance.getTickets();

    expect(min).to.eql(web3.utils.toBN(0));
    expect(max).to.eql(web3.utils.toBN(0));
    expect(tickets).to.be.empty;
  });

  it('should fail when a non existent ticket is attempted to be retrieved', async () => {
    await expectRevert(instance.getTicket(0), "Ticket value out of range, too high");
    await instance.issueTicket(trader1);
    await expectRevert(instance.getTicket(1), "Ticket value out of range, too high");

    while ((await instance.getMin()).toString() === "0") {
      await instance.draw();
    }
    await expectRevert(instance.getTicket(0), "Ticket value out of range, too low");
  });

  it('should create a new ticket when a new ticket is issued', async () => {
    await instance.issueTicket(trader1);

    let min = await instance.getMin();
    let max = await instance.getMax();
    let tickets = await instance.getTickets();

    expect(min).to.eql(web3.utils.toBN(0));
    expect(max).to.eql(web3.utils.toBN(1));
    expect(tickets).to.be.not.empty;
  });

  it('should create multiple tickets', async () => {
    let nTickets = 5;
    await instance.issueTickets(trader1, nTickets);
    expect((await instance.getTraderTicketAmount(trader1)).toString()).to.be.eql(new BN(nTickets).toString());
  });

  it('should retrieve a tickets owner', async () => {
    await instance.issueTicket(trader1);
    let ticket = await instance.getTicket(0);
    expect(ticket).to.equal(trader1);
  });

  it('should retrieve the amount of tickets owned by an address', async () => {
    let nTickets = 5;
    for (let i = 0; i < nTickets; i++) {
      await instance.issueTicket(trader1);
    }
    let ticketAmount = await instance.getTraderTicketAmount(trader1);
    expect(ticketAmount).to.eql(web3.utils.toBN(nTickets));
  });

  it('should draw a ticket from one of the available traders', async () => {
    await instance.issueTicket(trader1);
    await instance.issueTicket(trader2);
    await instance.issueTicket(trader3);

    let ticket = await instance.getTicket(0);
    expect(ticket).to.equal(trader1);
    ticket = await instance.getTicket(1);
    expect(ticket).to.equal(trader2);
    ticket = await instance.getTicket(2);
    expect(ticket).to.equal(trader3);

    let receipt = await instance.draw();
    let leader = await instance.getCurrentLeader();
    expectEvent(receipt, "NewLeader", {leader: leader});
  });
});
