inotifywait -e close_write,moved_to,create -m . |
while read -r directory events filename; do
  echo "compiling abi and bin from ./contracts/*, overwriting in ./bin"
  rm -r ../bin
  solc --overwrite -o ../bin --abi --bin ./*.sol
done