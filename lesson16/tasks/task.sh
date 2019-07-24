#! /bin/bash

sleep 3
mongo mongodb://${MONGO_LOGIN}:${MONGO_PASSWORD}@mongo/admin < ${TASK_FILE}
