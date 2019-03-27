const setup = require('../setup/setup.js');

const testAccount = "0x47681d90A3B1B044980c39ed1e32D160a8043Ceb";
const testPassword = "testaccount";
let gasAmount = 100000000000;

let contracts = setup.deployContracts(testAccount, testPassword, gasAmount);
