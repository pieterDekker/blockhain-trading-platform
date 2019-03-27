FROM node:11.12.0-alpine

LABEL version="1.0"
LABEL maintainer="p.dekker.2@student.rug.nl"

RUN apk update && apk upgrade && \
    apk add --no-cache bash git openssh python make g++

RUN addgroup -g 2000 benchmark_user \
&& adduser -u 2000 -G benchmark_user -s /bin/sh -D benchmark_user

COPY contracts/* /home/benchmark_user/contracts/
RUN chown -R benchmark_user:benchmark_user /home/benchmark_user/contracts/

USER benchmark_user
WORKDIR /home/benchmark_user

#RUN yarn add web3
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

COPY benchmark/* /home/benchmark_user/benchmark/
COPY setup/* /home/benchmark_user/setup/
COPY byte_utils.js /home/benchmark_user/
COPY event_utils.js /home/benchmark_user/
COPY ipfs_util.js /home/benchmark_user/
COPY key_utils.js /home/benchmark_user/
COPY marketplace.js /home/benchmark_user/
COPY matches.js /home/benchmark_user/
COPY Matchmaking.js /home/benchmark_user/
COPY matchmaking_utils.js /home/benchmark_user/
COPY node_utils.js /home/benchmark_user/
COPY paymentAgreements.js /home/benchmark_user/
COPY test_util.js /home/benchmark_user/
COPY tradeAgreements.js /home/benchmark_user/
COPY type_utils.js /home/benchmark_user/
COPY watch.js /home/benchmark_user/

#WORKDIR /home/benchmark_user/setup
#RUN node setup.js

#ENTRYPOINT /bin/sh
#CMD ["/bin/sh"]
ENTRYPOINT ["tail", "-F", "/dev/null"]

#ENTRYPOINT ["./geth", "--gasprice", "0", "--datadir", "./private_chain", "--port", "30303", "--nodiscover", "--ws", "--wsport", "8546", "--wsorigins", "*", "--wsapi", "db,eth,net,web3,miner,personal", "--networkid", "230594", "--verbosity", "5", "--minerthreads", "1", "console", "2>>node_error"]

#build: docker build -f benchmark.Dockerfile -t benchmark:latest .
#run as standalone: docker run --name geth_container -td --cpus=1 --network host -p 30303:30303 -p 8546:8546 geth:latest
#attach: docker exec -it geth_container bash
