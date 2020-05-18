### The genesis JSON
The genesis JSON is designed to best serve the project. Gas price is set to zero, so is difficulty. There are 10 accounts with 2^200 wei, whose passphrase is "testing".

To start the node, simply run `docker-compose build` and then `docker-compose up`. If the node is to be simulated running on a weaker machine, uncomment the deploy section in `docker-compose.yml`, change the number of cpus as desired and run `docker-compose --compatibility up`. The number of cpus is a string representing a floating number which is interpreted as a fraction of a single cpu of the host machine.

For benchmarking purposes, start the node and connect to it from a separate terminal by running `geth_console.sh`. Once connected to the node, enter the command `miner.start()`, immediately followed by `miner.stop()`. This will trigger generation of the DAG, which takes around 3-5 minutes when given the better part of 8 8th generation intel i5 notebook cores and an SSD.
