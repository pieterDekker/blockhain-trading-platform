#FROM node:11.12.0-alpine
FROM ubuntu:16.04

LABEL version="1.0"
LABEL maintainer="p.dekker.2@student.rug.nl"

RUN adduser --disabled-login --gecos "" full_user

#RUN addgroup -g 2000 full_user \
#&& adduser -u 2000 -G full_user -s /bin/sh -D full_user

RUN apt-get update
#RUN apt-get upgrade
RUN apt-get install --yes bash
RUN apt-get install --yes git
RUN apt-get install --yes openssh-client
RUN apt-get install --yes openssh-server
RUN apt-get install --yes python
RUN apt-get install --yes make
RUN apt-get install --yes g++

RUN apt-get install --yes curl
RUN curl --silent --location https://deb.nodesource.com/setup_11.x | bash -
RUN apt-get install --yes nodejs
RUN apt-get install --yes build-essential

COPY geth /home/full_user
RUN chown full_user:full_user /home/full_user/geth

COPY mutant_chain_ws.sh /home/full_user
RUN chown full_user:full_user /home/full_user/mutant_chain_ws.sh

COPY chain_init_data /home/full_user/chain_init_data

COPY contracts/* /home/full_user/contracts/
RUN chown -R full_user:full_user /home/full_user/contracts/

#USER full_user
#WORKDIR /home/full_user


COPY contracts/* /home/full_user/contracts/
RUN chown -R full_user:full_user /home/full_user/contracts/

COPY benchmark/* /home/full_user/benchmark/
COPY setup/* /home/full_user/setup/
COPY byte_utils.js /home/full_user/
COPY event_utils.js /home/full_user/
COPY ipfs_util.js /home/full_user/
COPY key_utils.js /home/full_user/
COPY marketplace.js /home/full_user/
COPY matches.js /home/full_user/
COPY Matchmaking.js /home/full_user/
COPY matchmaking_utils.js /home/full_user/
COPY node_utils.js /home/full_user/
COPY paymentAgreements.js /home/full_user/
COPY test_util.js /home/full_user/
COPY tradeAgreements.js /home/full_user/
COPY type_utils.js /home/full_user/
COPY watch.js /home/full_user/

#RUN ./mutant_chain_ws.sh reinit

#EXPOSE 30303 30303
#EXPOSE 8546 8546

USER full_user
WORKDIR /home/full_user

#RUN yarn add web3@1.0.0-beta.36
#RUN yarn add ipfs
#RUN yarn add pubsub-js
#RUN yarn add chalk
#RUN yarn add keythereum
#RUN yarn add keypair
#RUN yarn add solc

RUN npm install web3@1.0.0-beta.36
RUN npm install ipfs
RUN npm install pubsub-js
RUN npm install chalk
RUN npm install keythereum
RUN npm install keypair
RUN npm install solc

RUN ./mutant_chain_ws.sh reinit
RUN ./mutant_chain_ws.sh run

RUN ["./geth", "--gasprice", "0", "--datadir", "./private_chain", "--port", "30303", "--nodiscover", "--ws", "--wsport", "8546", "--wsorigins", "*", "--wsapi", "db,eth,net,web3,miner,personal", "--networkid", "230594", "--verbosity", "5", "--minerthreads", "1", "console", "2>>node_error"]
#
WORKDIR /home/full_user/setup
RUN node setup.js

#ENTRYPOINT /bin/sh
#CMD ["/bin/sh"]
#ENTRYPOINT ["tail", "-F", "/dev/null"]

#ENTRYPOINT ["./geth", "--gasprice", "0", "--datadir", "./private_chain", "--port", "30303", "--nodiscover", "--ws", "--wsport", "8546", "--wsorigins", "*", "--wsapi", "db,eth,net,web3,miner,personal", "--networkid", "230594", "--verbosity", "5", "--minerthreads", "1", "console", "2>>node_error"]

#build: docker build -f benchmark.Dockerfile -t benchmark:latest .
#run as standalone: docker run --name geth_container -td --cpus=1 --network host -p 30303:30303 -p 8546:8546 geth:latest
#attach: docker exec -it geth_container bash
