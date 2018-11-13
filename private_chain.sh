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

if [ "$arg" == "init" ] 
then
	echo "initializing the chain..."
	echo "node name is: $HOST_NAME"
	
	#init the chain, create genesisblock etc.
	geth --identity $HOST_NAME --gasprice "0" --rpc --rpcport "8545" --rpccorsdomain "http://localhost:8545" --datadir "./private_chain" --port "30303" --nodiscover\
	 --rpcapi "db,eth,net,web3,personal" --networkid 230594 init $PWD"/chain_init_data/genesis_json" 2>>node_error | tee -a node_output
elif [ "$arg" == "run" ]
then
	echo "running the chain and starting a console..."
	echo "node name is: $HOST_NAME"
	
	#run the node and start a console to interact with it
	geth --identity $HOST_NAME --gasprice "0" --rpc --datadir "./private_chain" --port "30303" --nodiscover\
	--rpcapi "db,eth,net,web3,personal,miner" --networkid 230594 console 2>>node_error
else
	echo "Usage: private_chain [init|run]"
	echo "	init: create and initialize a new chain"
	echo "	run: run an already initialized chain"
	echo "	exec: execute the provided script_name"
fi