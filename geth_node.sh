#!/usr/bin/env bash

HOST_NAME=$(hostname)

# Explanation of arguments to geth command
# - identity		: The name of the node, for easier identification in a list of nodes
# - rpc				: Enable remote procedure calls on this node
# - rpcport 		: The port to listen on for remote procedure calls
# - rpccorsdomain	: The urls from which remote procedure calls are accepted on this node
# - datadir			: The location at which all the chains data is stored
# - port			: The port used for peers to connect to this node
# - nodiscover		: This node can only be connected to manually
# - rpcapi			: The remote procedure call api's that are to be enabled on this node
# - networkid		: The number that identifies this network together with the genesis block
# - init			: The command to geth that is going to make this a new initialization, instead of starting up an existing chain.
# 					  Is followed by the location of the genesis json file
# - console			: The command to run the node and start the interaction console

arg=$1

if [[ "$arg" == "init" ]]
then
	echo "initializing the blockchain..."
	echo "node name is: $HOST_NAME"

	#init the chain, create genesisblock etc.
	./geth --identity $HOST_NAME --gasprice 0 --datadir "./private_chain" --ethash.dagdir "./ethash" --port "30303" --nodiscover \
	--networkid 230594 init $PWD"/chain_init_data/genesis_json" 2>>node_error | tee -a node_output
elif [[ "$arg" == "reinit" ]]
then
    echo "removing old blockchain"
    rm -r $PWD/private_chain/
    rm $PWD/node_error $PWD/node_output
	echo "reinitializing the blockchain ..."
	echo "node name is: $HOST_NAME"

	#init the chain, create genesisblock etc.
	./geth --identity $HOST_NAME --gasprice 0 --datadir "./private_chain" --ethash.dagdir "./ethash" --port "30303" --nodiscover \
	--ws --wsport 8546 --wsorigins "*" --wsapi "db,eth,net,web3,miner,personal" \
	--syncmode "light" --verbosity 5 --minerthreads 1 --networkid 230594 init $PWD"/chain_init_data/genesis_json" 2>>node_error | tee -a node_output
	cp $PWD/chain_init_data/UTC--2018-06-26T03-59-03.509883478Z--47681d90a3b1b044980c39ed1e32d160a8043ceb $PWD/private_chain/keystore/
elif [[ "$arg" == "run" ]]
then
	echo "running a geth node and starting a console..."
	echo "node name is: $HOST_NAME"

	#run the node and start a console to interact with it
	./geth --identity $HOST_NAME --gasprice 0 --datadir "./private_chain" --ethash.dagdir "./ethash" --port "30303" --nodiscover \
	--ws --wsport 8546 --wsorigins "*" --wsapi "db,eth,net,web3,miner,personal" --networkid 230594 \
	--verbosity 5 --minerthreads 1 console 2>>node_error
elif [[ "$arg" == "detached" ]]
then
	echo "running a geth node in the background..."
	echo "node name is: $HOST_NAME"

	#run the node and start a console to interact with it
	./geth --identity $HOST_NAME --gasprice 0 --datadir "./private_chain" --ethash.dagdir "./ethash" --port "30303" --nodiscover \
	--ws --wsport 8546 --wsorigins "*" --wsapi "db,eth,net,web3,miner,personal" --networkid 230594 \
	--verbosity 5 --minerthreads 1 2>>node_error
else
	echo "Usage: private_chain [init|reinit|run|detached]"

	echo "	init: create and initialize a new blockchain"
	echo "	init: remove a previously created blockchain, initialize a new blockchain"
	echo "	run: run a geth node and starting an attached console, requires an initialized blockchain"
	echo "  detached: run a geth node in the background, requires an initialized blockchain"
fi
