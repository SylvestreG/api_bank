#!/bin/bash
set -x

cd data

FILE=`basename $1`

curl -d "@$FILE" -H "Content-type: application/json" -X POST http://localhost:8080/webhooks/transactions

cd -