#!/usr/bin/env bash

date_time=`date +"%Y_%m_%d_%H_%M"`

if [[ `geth attach` == "Fatal: Unable to attach to remote geth: dial unix /home/pieter/.ethereum/geth.ipc: connect: no such file or directory" ]]; then
    ./geth_node.sh
fi

if [[ ! -f "benchmark/${date_time}_output" ]]; then
    touch "benchmark/${date_time}_output"
fi

if [[ ! -f "benchmark/${date_time}_error" ]]; then
    touch "benchmark/${date_time}_error"
fi

for ((size=10; size <= 20; size+=10)); do
    echo "error output for a benchmark test with ${size} offers" >> "./benchmark/${date_time}_error"

    node benchmark/benchmark.js ${size} \
        1>>"./benchmark/${date_time}_output" \
        2>>"./benchmark/${date_time}_error"

    echo "----------------------" >> "./benchmark/${date_time}_output"
    echo "----------------------" >> "./benchmark/${date_time}_error"

done