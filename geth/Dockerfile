FROM ethereum/client-go

ADD genesis.json .

RUN geth --datadir /root/geth-data-dir --networkid 97476571 --nousb init genesis.json

ADD ./keys/* /root/geth-data-dir/keystore/

ADD ./passwords.txt /root/geth-data-dir
