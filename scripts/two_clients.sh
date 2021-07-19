#!/bin/bash
set -x

curl -H "Content-type: application/json" -X GET "http://localhost:8080/api/stats/marchant/two_client/$1/$2"
