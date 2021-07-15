#!/bin/bash

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${GREEN} --> ${PURPLE}Stopping docker containers${NC}"
docker container stop bank_db
docker container rm bank_db

echo -e "${GREEN} --> ${PURPLE}Building DB docker${NC}"
docker build -t bank -f Dockerfile_db .

echo -e "${GREEN} --> ${PURPLE}Launching DB docker container${NC}"
docker run -d --name bank_db -p 5432:5432 bank

