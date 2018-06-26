#!/usr/bin/env bash
echo "initially compiling abi and bin from chain/contracts/*.sol, overwriting in chain/bin"
./compile.sh

inotifywait -e close_write,moved_to,create -m . |
while read -r directory events filename; do
  echo "recompiling abi and bin from chain/contracts/*.sol, overwriting in chain/bin"
  ./compile.sh
  echo "###############################"
done
