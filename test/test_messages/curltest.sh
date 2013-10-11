#!/bin/sh

curl -iv -H "Content-Type: application/json" -X POST --data @./test_message.json http://localhost:8090/assessments
