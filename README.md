# Blockhain trading platform

## Goal

The goal of this project is to explore the feasibility of the creation of a system as described in *[reference]*

## Installation

To install the system perform the following steps:
1. clone this repository
2. clone *[reference]* to a place of your preference, follow the install instructions in the readme in that repository and move the resulting executable, `geth` to the root folder of your cloned repository
3. run 

## Design

A detailed description of the design that led the development of this system can be found here *[reference]*

# Benchmarking

To get an idea how fast the system can process different amounts of transactions, a very basic benchmarking shell script was made. The script runs a different script, written in Javascript with several input sizes and writes the standard output en error streams to different files. To be able to perform a benchmark:
1. run `geth_node.sh reinit`
2. run `geth_node.sh run`
3. start the miner by entering `miner.start()` in the geth console
4. wait for the DAG to be generated, otherwise the results will be skewed by the script waiting for the node to generate the DAG 
5. stop the miner by entering `miner.stop()` in the geth console
6. run `benchmark_runner.sh`
