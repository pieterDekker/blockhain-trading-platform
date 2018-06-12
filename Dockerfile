FROM ubuntu:16.04

LABEL version="1.0"
LABEL maintainer="p.dekker.2@student.rug.nl"

RUN apt-get update && apt-get install --yes software-properties-common
RUN add-apt-repository ppa:ethereum/ethereum
RUN apt-get update && apt-get install --yes geth

RUN adduser --disabled-login --gecos "" eth_user

COPY chain_init_data /home/eth_user/chain_init_data
RUN chown -R eth_user:eth_user /home/eth_user/chain_init_data
USER eth_user
WORKDIR /home/eth_user

RUN geth init "./chain_init_data/genesis_json"

CMD ["geth", "console"]