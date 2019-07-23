#! /bin/bash

sleep 15
mongo mongodb://${MONGO_LOGIN}:${MONGO_PASSWORD}@mongo < ${TASK_FILE}
