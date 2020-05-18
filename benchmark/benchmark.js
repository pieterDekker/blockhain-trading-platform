const chalk = require('chalk');
const log_update = require('log-update');
const ArgumentParser = require('argparse').ArgumentParser;

const Marketplace = artifacts.require('Marketplace');
const Leadership = artifacts.require('Leadership');
const Traders = artifacts.require('Traders');
const Registry = artifacts.require('Registry');

web3 = web3.extend({
	property : 'miner',
	methods : [
		{
			name: 'stop',
			call: 'miner_stop',
		},
		{
			name: 'start',
			call: 'miner_start',
			params: 1
		}
	]
});

/**
 * Module.exports is a function that takes a single callback as argument, as per {@link https://www.trufflesuite.com/docs/truffle/getting-started/writing-external-scripts#file-structure}
 */
module.exports = async function(callback) {
  const {
    verbose,
  } = getArgs();

  try {
    await main(callback);
  } catch (e) {
    // Catch any errors that are not supposed to happen, such as account not unlocked, etc.
    if (verbose) console.log(e);
    errorExit(e.message, callback);
  }
}

/**
 * The main benchmark function.
 * 
 * @param {Function} callback The truffle exec callback
 */
async function main(callback) {
  let {
    account,
    global_timeout,
    log_timeout,
    offer_amount,
    miner_threads,
    passphrase,
    verbose,
  } = getArgs();

  // Make sure we have a websocket connection
  if (web3.currentProvider.connection._url.substr(0,5) !== "ws://") {
    errorExit("The connection with the client should be over websocket. Make sure the connected network as 'websockets' set to true in truffle-config.js and that the used client has the WS RPC api enabled.")
  }
  
  // Best run on a completely fresh node
  if (await web3.eth.isMining()) {
    errorExit("Miner already running. Please run a dedicated node for this benchmark", callback);
  }
  
  global_timeout = global_timeout || 1000;
  
  // Expecting the node to have account[0] unlocked
  account = await getAccount();
  if (verbose) console.log(`Using account ${account}...`);

  // Prepare the offer paths
  offer_amount = offer_amount || 100;
  if (verbose) console.log(`Creating ${offer_amount} offers...`);
  let offers = getOffers(offer_amount);

  // Start the miner
  miner_threads = miner_threads || 1;
  if (verbose) console.log(`Starting miner using ${miner_threads} thread(s)...`);
  await web3.miner.start(miner_threads);
  if (!await web3.eth.isMining()) {
    errorExit("Failed to start miner, exiting...", callback)
  }

  marketplace = await getMarketplaceContract(account);
  if (verbose) console.log("Contracts deployed and initialized, beginning test...");

  // Set a timeout after which we quit, no matter what.
  if (global_timeout) {
    setTimeout(() => {
      errorExit("Global timeout expired", callback);
    }, global_timeout * 1000);
    if (verbose) console.log(`Timing out after ${global_timeout} seconds...`);
  }

  // Start the benchmark
  const t0 = Date.now();
  let log_timeout_reference;
  if (verbose && log_timeout) console.log(`Timing out after ${log_timeout} seconds have passed since the last log...`);
  for (let offer_path in offers) {
    marketplace.publishOffer(web3.utils.asciiToHex(offer_path))
    offers[offer_path].sent = true;
    // Reset the log timer if we have a log timeout period
    if (log_timeout){
      if (log_timeout_reference) {
        clearTimeout(log_timeout_reference);
      }
      log_timeout_reference = setTimeout(() => {
        errorExit(`${log_timeout} seconds passed since the last log was received, exiting...`, )
      }, log_timeout * 1000);
    }
  }
  if (verbose) console.log(`${offer_amount} offers sent...`);
  
  // Write progress update 4 times per second
  offers_succesfully_published = 0;
  let update_interval_reference;
  if (verbose) {
    update_interval_reference = setInterval(() => {
      let percentage = (offers_succesfully_published / offer_amount) * 100;
      log_update(`${offers_succesfully_published}/${offer_amount} (${percentage}%) offers succesfully received after ${(Date.now() - t0)/1000} seconds...`)
    }, 250);
  }

  // Wait for completion
  await new Promise((resolve) => {
    marketplace.NewOffer().on('data', async (event) => {
      let offer_path_bytes = await marketplace.getOffer(event.returnValues.index);
      let offer_path = web3.utils.hexToAscii(offer_path_bytes);
      
      if (offers[offer_path].received === false) {
        offers_succesfully_published += 1
      }

      offers[offer_path].received = true;

      if (offers_succesfully_published === offer_amount) {
        clearInterval(update_interval_reference);
        resolve();
      }
    });
  });

  // Compute and write results.
  const t1 = Date.now();
  const total_elapsed_seconds = (t1 - t0) / 1000;
  log_update(`Sent ${offer_amount} offers. All were received correctly after ${total_elapsed_seconds} seconds.`);
  if (verbose) console.log("Done. Stopping miner...");
  exit(callback);
}

/**
 * Get the arguments as a JS object.
 */
function getArgs() {  
  const argParser = new ArgumentParser({
    prog: 'blockchain-trading-platform benchmark',
    version: '0.0.1',
    addHelp: true,
    description: 'Run benchmark tests'
  });

  argParser.addArgument(
    ['--offer-amount'], 
    {
      type: Number,
      help: 'The amount of offers to send'
    }
  );

  argParser.addArgument(
    ['--account'], 
    {
      type: String,
      help: 'The account to send the offers from. If provided, --passphrase is also required.'
    }
  );

  argParser.addArgument(
    ['--passphrase'], 
    {
      type: String,
      help: 'The passphrase needed to unlock the account'
    }
  );

  argParser.addArgument(
    ['--verbose'],
    {
      action: 'storeConst',
      constant: true,
      defaultValue: false,
      help: 'Whether to output as much as possible or not'
    }
  );

  argParser.addArgument(
    ['--global-timeout'],
    {
      type: Number,
      help: 'The maximum time allowed for the benchmark test in seconds'
    }
  );

  argParser.addArgument(
    ['--log-timeout'],
    {
      type: Number,
      help: 'The maximum time allowed with no logs after the first offer is sent'
    }
  );

  argParser.addArgument(
    ['--miner-threads'],
    {
      type: Number,
      help: 'The amount of threads to use for the miner'
    }
  );

  rawArgs = argParser.parseKnownArgs();
  return rawArgs[0];
}

/**
 * Get the first account available.
 */
async function getAccount() {
  return (await web3.eth.personal.getAccounts())[0];
}

/**
 * Create a list of Objects keyed by offer path, containing fields 'sent' and 'received'.
 * 
 * @param {Number} offer_amount 
 */
function getOffers(offer_amount) {
  let offers = [];
  for (let i = 0; i < offer_amount; i++) {
    let offer_path = web3.utils.randomHex(46).substr(2);
    offers[offer_path] = {
      sent: false,
      received: false
    };
  }
  return offers;
}

/**
 * Deploy the Marketplace contract and it's dependencies.
 * 
 * @param {String} account 
 */
async function getMarketplaceContract(account) {
  let leadership = await Leadership.new();
  let traders = await Traders.new();
  await traders.newTrader(account);
  let registry = await Registry.new(
    leadership.address,
    '0x0000000000000000000000000000000000000000', // Marketplace
    '0x0000000000000000000000000000000000000000', // PaymentAgreements
    '0x0000000000000000000000000000000000000000', // TradeAgreements
    traders.address
  );
  marketplace = await Marketplace.new(true, false);
  await marketplace.initialize(registry.address);
  marketplace.autoGas = true;
  return marketplace;
}

/**
 * Exit normally.
 * 
 * @param {Function} callback 
 */
async function exit(callback) {
  await web3.miner.stop();
  web3.currentProvider.disconnect();
  callback();
}

/**
 * Exit with an error.
 * 
 * @param {String} message The message to exit with
 * @param {Function} callback The truffle exec callback
 */
async function errorExit(message, callback) {
  console.log(chalk.red("An error occurred: " + message));
  await web3.miner.stop();
  web3.currentProvider.disconnect();
  callback("Error exit");
};
