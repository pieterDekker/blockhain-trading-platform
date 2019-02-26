FROM ubuntu:16.04
#FROM mhart/alpine-node:6

LABEL version="1.0"
LABEL maintainer="p.dekker.2@student.rug.nl"

#RUN apt-get update && apt-get install --yes software-properties-common
#RUN add-apt-repository ppa:ethereum/ethereum
#RUN apt-get update && apt-get install --yes geth
#RUN apk update && apk add libc6-compat

RUN adduser --disabled-login --gecos "" eth_user
#RUN adduser -D -g "" eth_user

COPY geth /home/eth_user
RUN chown eth_user:eth_user /home/eth_user/geth

COPY mutant_chain_ws.sh /home/eth_user
RUN chown eth_user:eth_user /home/eth_user/mutant_chain_ws.sh

COPY chain_init_data /home/eth_user/chain_init_data
#RUN chown -R eth_user:eth_user /home/eth_user/chain_init_data

COPY contracts/* /home/eth_user/contracts/
RUN chown -R eth_user:eth_user /home/eth_user/contracts/

USER eth_user
WORKDIR /home/eth_user

RUN ./mutant_chain_ws.sh init

ENTRYPOINT "./mutant_chain_ws.sh"