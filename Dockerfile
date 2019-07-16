FROM ubuntu:16.04

LABEL version="1.0"
LABEL maintainer="p.dekker.2@student.rug.nl"

RUN adduser --disabled-login --gecos "" eth_user

COPY geth /home/eth_user
RUN chown eth_user:eth_user /home/eth_user/geth

COPY mutant_chain_ws.sh /home/eth_user
RUN chown eth_user:eth_user /home/eth_user/mutant_chain_ws.sh

COPY chain_init_data /home/eth_user/chain_init_data

COPY contracts/* /home/eth_user/contracts/
RUN chown -R eth_user:eth_user /home/eth_user/contracts/

USER eth_user
WORKDIR /home/eth_user

RUN ./mutant_chain_ws.sh reinit

EXPOSE 30303 30303
EXPOSE 8546 8546

ENTRYPOINT ["./geth", "--gasprice", "0", "--datadir", "./private_chain", "--port", "30303", "--nodiscover", "--ws", "--wsport", "8546", "--wsorigins", "*", "--wsapi", "db,eth,net,web3,miner,personal", "--networkid", "230594", "--verbosity", "5", "--minerthreads", "1", "console", "2>>node_error"]

#build: docker build -t geth:latest .
#run as standalone: docker run --name geth_container -td --cpus=1 --network host -p 30303:30303 -p 8546:8546 geth:latest
#attach: docker exec -it geth_container bash
