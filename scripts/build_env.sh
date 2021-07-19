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

echo -e "${GREEN} --> ${PURPLE}Building sources${NC}"
tsc --build tsconfig.json
sleep 3

echo -e "${GREEN} --> ${PURPLE}Adding users into DB${NC}"
node src/populate_db.js --jsonFile=data/user.json --tableName=users

echo -e "${GREEN} --> ${PURPLE}Adding account into DB${NC}"
node src/populate_db.js --jsonFile=data/account.json --tableName=account

echo -e "${GREEN} --> ${PURPLE}Adding card into DB${NC}"
node src/populate_db.js --jsonFile=data/cb.json --tableName=card

echo -e "${GREEN} --> ${PURPLE}Adding company into DB${NC}"
node src/populate_db.js --jsonFile=data/company.json --tableName=company

echo -e "${GREEN} --> ${PURPLE}Adding cbmerchantid into DB${NC}"
node src/populate_db.js --jsonFile=data/cbmerchantid.json --tableName=cbmerchantid

echo -e "${GREEN} --> ${PURPLE}Adding cbmerchantid2 into DB${NC}"
node src/populate_db.js --jsonFile=data/cbmerchantid2.json --tableName=cbmerchantid

echo -e "${GREEN} --> ${PURPLE}Adding cbtransaction into DB${NC}"
node src/populate_db.js --jsonFile=data/cbtransaction.json --tableName=cbtransaction

echo -e "${GREEN} --> ${PURPLE}Adding transaction into DB${NC}"
node src/populate_db.js --jsonFile=data/transaction.json --tableName=transaction
