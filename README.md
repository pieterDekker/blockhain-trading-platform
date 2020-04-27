### Requirements
Apart from the requirements listed in package.json, the following requirements have to be met:
- Truffle v5.1.20
- Ganache CLI v6.9.0 (ganache-core: 2.10.1)

As a note, but not necessarily a requirement, the following versions of yarn and node are used for development:
- Yarn v1.22.4
- Node v13.13.0

### Running the tests
The tests can be run by running `truffle test --network development_ganache_cli`. This expects an instance of Ganache CLI to be running and listening on the port listed under `development_ganache_cli` in truffle-config.js. 

Running `ganache-cli -p 8545` (in a separate terminal) without any arguments should result in a Ganache CLI instance running and listening on the right port.

Adding a different network in truffle-config.js and using that network will allow for the tests to be run using a different network.
